import { Controller, Get } from '@nestjs/common';
import { Session, SessionsEmitterConsumer } from './sessions.consumer';

@Controller('sessions')
export class SessionsController {
  constructor(
    private readonly sessionsEmitterConsumer: SessionsEmitterConsumer,
  ) {}

  @Get()
  getAllSessions(): Session[] {
    return this.sessionsEmitterConsumer.getAllSession();
  }
}
