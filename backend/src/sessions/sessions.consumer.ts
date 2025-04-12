import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { WebSocket } from 'ws';

import { CacheService, WrappedCacheManager } from 'src/cache/cache.service';
import { SessionsEmitterMessage, SessionsEmitterEventType } from './types';
import { Events } from '../events';
import { DeanonymizerService } from 'src/deanonymizer/deanonymizer.service';
import { DeanonymizerResponse } from 'src/deanonymizer/types';

type Session = {
  firstTimeSeenUTC: number;
  timesRefreshed: number;
};

const SERVER_URL = 'ws://localhost:8080';
const SESSION_EXPIRATION_LIMIT_IN_SECONDS = 60;
const GUID_BLACKLIST = [
  'b8e8879e-3382-4908-8f1e-7638473d0913',
  '830886a1-728e-4d94-a808-44a92841154b',
];

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
  private readonly cacheManager: WrappedCacheManager;
  private socketClient: WebSocket;

  constructor(
    private eventEmitter: EventEmitter2,
    private cacheService: CacheService,
    private deanonymizerService: DeanonymizerService,
  ) {
    this.cacheManager = this.cacheService.createNamespaceWrappedCacheManager(
      this.CACHE_NAMESPACE,
      SESSION_EXPIRATION_LIMIT_IN_SECONDS,
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
      `Expired Session = : ${key} ${Date.now() - value.firstTimeSeenUTC} ${value.timesRefreshed}`,
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
      void this.processMessage(data);
    });
  }

  onModuleInit() {
    this.initializeSocketClient();
  }

  parseMessage(buffer: Buffer) {
    const messageString = buffer.toString();
    try {
      const message = JSON.parse(messageString) as SessionsEmitterMessage;
      return message;
    } catch (e) {
      this.logger.error(`parseSessionsEmitterMessage ~ e: ${(e as Error).message}`);
    }
  }

  async processMessage(buffer: Buffer) {
    const message = this.parseMessage(buffer);

    if (!message) {
      return;
    }

    const deanonymizedData = await this.deanonymizerService.deanomyizeIp(
      message.ip,
    );

    if (!deanonymizedData) {
      return;
    }

    const isBlacklisted = deanonymizedData.data.company?.guid
      ? GUID_BLACKLIST.includes(deanonymizedData.data.company?.guid)
      : false;

    if (isBlacklisted) {
      this.logger.debug(`Ip is blacklisted: ${message.ip}`);
      return;
    }

    return this.processMessagePerType({ message, deanonymizedData });
  }

  processMessagePerType({
    deanonymizedData,
    message,
  }: {
    deanonymizedData: DeanonymizerResponse;
    message: SessionsEmitterMessage;
  }) {
    const key = message.ip;

    switch (message.eventType) {
      case SessionsEmitterEventType.CLOSED: {
        this.deleteSession({ key, deanonymizedData });
        break;
      }
      case SessionsEmitterEventType.KEEP_ALIVE:
      case SessionsEmitterEventType.OPENED: {
        this.createOrUpdateSession({ key, message, deanonymizedData });
        break;
      }
      default: {
        this.logger.warn(
          `Message failed to process ${JSON.stringify(message)}`,
        );
      }
    }
  }

  deleteSession({
    key,
    deanonymizedData,
  }: {
    key: string;
    deanonymizedData: DeanonymizerResponse;
  }) {
    this.cacheManager.delete(key);
    this.logger.debug(`Closed session = : ${key.slice(0, 10)}`);

    this.eventEmitter.emit(Events.SESSIONS_EMITTER_SESSION_CHANGED, {
      key,
      type: CHANGE_TYPE.EXPIRED,
      deanonymizedData,
    });
  }

  createOrUpdateSession({
    key,
    deanonymizedData,
    message,
  }: {
    key: string;
    deanonymizedData: DeanonymizerResponse;
    message: SessionsEmitterMessage;
  }) {
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
        deanonymizedData,
      });
      return;
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
      deanonymizedData,
    });
  }
}
