import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { WebSocket } from 'ws';

import { CacheService, WrappedCacheManager } from 'src/cache/cache.service';
import { SessionsEmitterMessage, SessionsEmitterEventType } from './types';
import { Events } from '../events';
import { DeanonymizerService } from 'src/deanonymizer/deanonymizer.service';
import { Company, Contact, DeanonymizerResponse } from 'src/deanonymizer/types';

export type Session = {
  ip: string;
  firstTimeSeenUTC: number;
  lastActivityUTC: number;
  timesRefreshed: number;
  contact: null | Omit<Contact, 'guid'>;
  company: null | Omit<Company, 'guid'>;
};

const SERVER_URL = 'ws://localhost:8080';
const SESSION_EXPIRATION_LIMIT_IN_SECONDS = 60;
const GUID_BLACKLIST = [
  'b8e8879e-3382-4908-8f1e-7638473d0913',
  '830886a1-728e-4d94-a808-44a92841154b',
];

const EMAIL_DOMAIN_BLACKLIST = ['gmail', 'yahoo', 'hotmail', 'outlook', 'aol'];

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
  private readonly blacklistedEmailRegexps: RegExp[];
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

    this.blacklistedEmailRegexps = EMAIL_DOMAIN_BLACKLIST.map(
      (domain) => new RegExp(`.*@${domain}\.*.`),
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

  private initializeSocketClient() {
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

  private parseMessage(buffer: Buffer) {
    const messageString = buffer.toString();
    try {
      const message = JSON.parse(messageString) as SessionsEmitterMessage;
      return message;
    } catch (e) {
      this.logger.error(`parseSessionsEmitterMessage ~ e: ${(e as Error).message}`);
    }
  }

  private async processMessage(buffer: Buffer) {
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

  private processMessagePerType({
    deanonymizedData,
    message,
  }: {
    deanonymizedData: DeanonymizerResponse;
    message: SessionsEmitterMessage;
  }) {
    const key = message.ip;

    switch (message.eventType) {
      case SessionsEmitterEventType.CLOSED: {
        this.deleteSession(key);
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

  private deleteSession(key: string) {
    this.cacheManager.delete(key);
    this.logger.debug(`Closed session = : ${key.slice(0, 10)}`);

    this.eventEmitter.emit(Events.SESSIONS_EMITTER_SESSION_CHANGED, {
      key,
      type: CHANGE_TYPE.EXPIRED,
    });
  }

  private createOrUpdateSession({
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
      this.updateSession({ key, cachedSession });
      return;
    }

    const firstTimeSeenUTC = Date.now();
    this.logger.debug(
      `New Session = : ${key.slice(0, 10)} 0 ${message.eventType}`,
    );

    const contact = this.adaptContactData(deanonymizedData.data.contact);
    const company = this.adaptCompanyData(deanonymizedData.data.company);

    const session: Session = {
      ip: deanonymizedData.ip,
      firstTimeSeenUTC,
      lastActivityUTC: firstTimeSeenUTC,
      timesRefreshed: 0,
      contact,
      company,
    };

    this.cacheManager.set<Session>(key, session);
    this.eventEmitter.emit(Events.SESSIONS_EMITTER_SESSION_CHANGED, {
      key,
      type: CHANGE_TYPE.OPENED,
      session,
    });
  }

  private updateSession({
    key,
    cachedSession,
  }: {
    key: string;
    cachedSession: Session;
  }) {
    this.logger.debug(
      `Retrieved Session = : ${key.slice(0, 10)} ${Date.now() - cachedSession.lastActivityUTC} ${Date.now() - cachedSession.firstTimeSeenUTC} ${cachedSession.timesRefreshed}`,
    );

    const session: Session = {
      ...cachedSession,
      lastActivityUTC: Date.now(),
      timesRefreshed: cachedSession.timesRefreshed + 1,
    };

    this.cacheManager.set<Session>(key, session);
    this.eventEmitter.emit(Events.SESSIONS_EMITTER_SESSION_CHANGED, {
      key,
      type: CHANGE_TYPE.REFRESHED,
      session,
    });
  }

  private adaptCompanyData(company?: Company): Session['company'] {
    if (!company) {
      return null;
    }

    const { domain, name } = company;

    return {
      domain,
      name,
    };
  }

  private adaptContactData(contact?: Contact): Session['contact'] {
    if (!contact) {
      return null;
    }

    const emailAddresses = Array.isArray(contact.emailAddresses)
      ? contact.emailAddresses.filter(
          (email) =>
            !this.blacklistedEmailRegexps.some((regex) => regex.test(email)),
        )
      : [];

    const { name, phoneNumbers, title } = contact;

    return {
      emailAddresses,
      name,
      phoneNumbers,
      title,
    };
  }

  public getAllSession() {
    const cachedSessions = this.cacheManager.getAll<Session>();
    return Object.values(cachedSessions);
  }
}
