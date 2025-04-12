import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { WebSocket } from 'ws';

import { CacheService } from 'src/cache/cache.service';
import { SessionsEmitterMessage, SessionsEmitterEventType } from './types';
import { Events } from '../events';

type Session = {
  firstTimeSeenUTC: number;
  timesRefreshed: number;
};

const SERVER_URL = 'ws://localhost:8080';

enum CHANGE_TYPE {
  CLOSED = 'closed',
  EXPIRED = 'expired',
  OPENED = 'opened',
  REFRESHED = 'refreshed',
}

@Injectable()
export class SessionsEmitterConsumer implements OnModuleInit {
  private readonly CACHE_NAMESPACE = 'SESSIONS_EMITTER';
  private readonly logger = new Logger(SessionsEmitterConsumer.name);
  private readonly cacheManager: ReturnType<
    CacheService['createNamespaceWrappedCacheManager']
  >;
  private socketClient: WebSocket;

  constructor(
    private eventEmitter: EventEmitter2,
    private cacheService: CacheService,
  ) {
    this.cacheManager = this.cacheService.createNamespaceWrappedCacheManager(
      this.CACHE_NAMESPACE,
    );
  }

  @OnEvent(Events.CACHE_EXPIRED)
  handleSessionExpired({
    namespace,
    key,
    value,
  }: {
    namespace: string;
    key: string;
    value: Session;
  }) {
    if (namespace !== this.CACHE_NAMESPACE) {
      return;
    }

    this.logger.debug(
      `On expired = key, value: ${key} ${Date.now() - value.firstTimeSeenUTC} ${value.timesRefreshed}`,
    );

    this.eventEmitter.emit(Events.SESSIONS_EMITTER_SESSION_CHANGED, {
      key,
      type: CHANGE_TYPE.EXPIRED,
    });
  }

  initializeSocketClient() {
    this.logger.log('INITIALIZING NEW CONNECTION');
    this.socketClient?.removeAllListeners();
    this.socketClient?.terminate();

    this.socketClient = new WebSocket(SERVER_URL);
    this.socketClient.addEventListener('close', () =>
      this.initializeSocketClient(),
    );
    this.socketClient.on('message', (data: Buffer) => {
      this.processSessionsEmitterMessage(data);
    });
  }

  onModuleInit() {
    this.initializeSocketClient();
  }

  parseSessionsEmitterMessage(buffer: Buffer) {
    const messageString = buffer.toString();
    try {
      const message = JSON.parse(messageString) as SessionsEmitterMessage;
      return message;
    } catch (e) {
      if (e instanceof Error) {
        this.logger.error(
          `SessionsService ~ parseSessionsEmitterMessage ~ e: ${e.message}`,
        );
        return;
      }

      this.logger.error(`SessionsService ~ parseSessionsEmitterMessage ~ e: ${e}`);
    }
  }

  processSessionsEmitterMessage(buffer: Buffer) {
    const message = this.parseSessionsEmitterMessage(buffer);

    if (!message) {
      return;
    }

    const key = message.ip;

    switch (message.eventType) {
      case SessionsEmitterEventType.CLOSED: {
        this.cacheManager.delete(key);
        this.logger.debug(`Closed session = : ${key.slice(0, 10)}`);

        this.eventEmitter.emit(Events.SESSIONS_EMITTER_SESSION_CHANGED, {
          key,
          type: CHANGE_TYPE.EXPIRED,
        });
        break;
      }
      case SessionsEmitterEventType.KEEP_ALIVE:
      case SessionsEmitterEventType.OPENED:
      default: {
        const cachedSession = this.cacheManager.get<Session>(key);
        if (cachedSession) {
          this.logger.debug(
            `Retrieved Session = : ${key.slice(0, 10)} ${Date.now() - cachedSession.firstTimeSeenUTC} ${cachedSession.timesRefreshed} ${message.eventType}`,
          );
          this.cacheManager.set<Session>(key, {
            firstTimeSeenUTC: cachedSession.firstTimeSeenUTC,
            timesRefreshed: cachedSession.timesRefreshed + 1,
          });

          this.eventEmitter.emit(Events.SESSIONS_EMITTER_SESSION_CHANGED, {
            key,
            type: CHANGE_TYPE.REFRESHED,
          });
          break;
        }

        const firstTimeSeenUTC = Date.now();
        this.logger.debug(
          `New Session = : ${key.slice(0, 10)} 0 ${message.eventType}`,
        );
        this.cacheManager.set<Session>(key, {
          firstTimeSeenUTC,
          timesRefreshed: 0,
        });
        this.eventEmitter.emit(Events.SESSIONS_EMITTER_SESSION_CHANGED, {
          key,
          type: CHANGE_TYPE.OPENED,
        });
      }
    }
  }
}
