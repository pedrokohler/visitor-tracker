/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Test, TestingModule } from '@nestjs/testing';
import { SessionsGateway } from './sessions.gateway';
import { SessionsEmitterConsumer } from './sessionsEmitter.consumer';
import { CacheService } from 'src/cache/cache.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DeanonymizerService } from 'src/deanonymizer/deanonymizer.service';
import { ConfigService } from '@nestjs/config';
import { SessionsEmitterEventType } from './types';
import { Buffer } from 'node:buffer';

describe('Sessions', () => {
  let gateway: SessionsGateway;
  let consumer: SessionsEmitterConsumer;
  let deanonymizer: DeanonymizerService;
  let cacheService: CacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsGateway,
        SessionsEmitterConsumer,
        CacheService,
        {
          provide: DeanonymizerService,
          useValue: {
            deanonymizeIp: () => ({
              data: {
                ip: 'abc',
                company: {
                  guid: '123',
                },
              },
            }),
          },
        },
        EventEmitter2,
        ConfigService,
      ],
    }).compile();

    gateway = module.get<SessionsGateway>(SessionsGateway);
    consumer = module.get<SessionsEmitterConsumer>(SessionsEmitterConsumer);
    deanonymizer = module.get<DeanonymizerService>(DeanonymizerService);
    cacheService = module.get<CacheService>(CacheService);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
    expect(consumer).toBeDefined();
  });

  it('should be able to handle badly formatted messages', async () => {
    const buffer = Buffer.from('');
    const result = await consumer['processMessage'](buffer);

    expect(result).toBeUndefined();
  });

  it('should be able to handle empty responses from deanonymizer', async () => {
    const ip = 'abc';
    const message = JSON.stringify({
      ip,
      eventType: SessionsEmitterEventType.OPENED,
      guid: '123',
    });

    const buffer = Buffer.from(message);

    jest
      .spyOn(deanonymizer, 'deanonymizeIp')
      .mockImplementationOnce(() => Promise.resolve(undefined));
    await consumer['processMessage'](buffer);

    expect(cacheService.get(consumer['CACHE_NAMESPACE'], ip)).toBeUndefined();
  });

  it('should be able to handle blacklisted companies', async () => {
    const ip = 'abc';
    const message = JSON.stringify({
      ip,
      eventType: SessionsEmitterEventType.OPENED,
      guid: '123',
    });
    const buffer = Buffer.from(message);

    //@ts-expect-error
    consumer['COMPANY_GUID_BLACKLIST'] = [
      'b8e8879e-3382-4908-8f1e-7638473d0913',
      '830886a1-728e-4d94-a808-44a92841154b',
    ];

    //@ts-expect-error
    jest.spyOn(deanonymizer, 'deanonymizeIp').mockImplementationOnce(() => ({
      data: {
        company: {
          guid: 'b8e8879e-3382-4908-8f1e-7638473d0913',
        },
      },
    }));

    await consumer['processMessage'](buffer);

    expect(cacheService.get(consumer['CACHE_NAMESPACE'], ip)).toBeUndefined();

    //@ts-expect-error
    jest.spyOn(deanonymizer, 'deanonymizeIp').mockImplementationOnce(() => ({
      data: {
        company: {
          guid: '830886a1-728e-4d94-a808-44a92841154b',
        },
      },
    }));

    await consumer['processMessage'](buffer);

    expect(cacheService.get(consumer['CACHE_NAMESPACE'], ip)).toBeUndefined();
  });

  it('should properly process a OPENED message', async () => {
    const ip = 'abc';
    const message = JSON.stringify({
      ip,
      eventType: SessionsEmitterEventType.OPENED,
      guid: '123',
    });
    const buffer = Buffer.from(message);
    await consumer['processMessage'](buffer);

    expect(
      cacheService.get(consumer['CACHE_NAMESPACE'], ip),
    ).not.toBeUndefined();
  });

  it('should properly process a KEEP_ALIVE message', async () => {
    const ip = 'abc';
    const message = JSON.stringify({
      ip,
      eventType: SessionsEmitterEventType.KEEP_ALIVE,
      guid: '123',
    });
    const buffer = Buffer.from(message);

    await consumer['processMessage'](buffer);

    expect(
      cacheService.get(consumer['CACHE_NAMESPACE'], ip),
    ).not.toBeUndefined();
  });

  it('should properly process a CLOSED message', async () => {
    const ip = 'abc';
    const messageOpened = JSON.stringify({
      ip,
      eventType: SessionsEmitterEventType.OPENED,
      guid: '123',
    });
    const bufferOpen = Buffer.from(messageOpened);

    await consumer['processMessage'](bufferOpen);

    expect(
      cacheService.get(consumer['CACHE_NAMESPACE'], ip),
    ).not.toBeUndefined();

    const messageClosed = JSON.stringify({
      ip,
      eventType: SessionsEmitterEventType.CLOSED,
      guid: '123',
    });
    const bufferClosed = Buffer.from(messageClosed);

    await consumer['processMessage'](bufferClosed);
    expect(cacheService.get(consumer['CACHE_NAMESPACE'], ip)).toBeUndefined();
  });
});
