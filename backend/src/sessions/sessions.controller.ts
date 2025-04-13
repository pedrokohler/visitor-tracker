import { Controller, Get } from '@nestjs/common';
import { Session, SessionsEmitterConsumer } from './sessionsEmitter.consumer';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsEmitterConsumer: SessionsEmitterConsumer) {}

  @Get()
  getAllSessions(): Session[] {
    return this.sessionsEmitterConsumer.getAllSession();
  }
}
