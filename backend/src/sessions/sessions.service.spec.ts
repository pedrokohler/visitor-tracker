import { Test, TestingModule } from '@nestjs/testing';
import { SessionsEmitterConsumer } from './sessionsEmitter.consumer';

describe('SessionsService', () => {
  let service: SessionsEmitterConsumer;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SessionsEmitterConsumer],
    }).compile();

    service = module.get<SessionsEmitterConsumer>(SessionsEmitterConsumer);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
