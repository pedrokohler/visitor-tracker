import { Module } from '@nestjs/common';
import { SessionsEmitterConsumer } from './sessionsEmitter.consumer';
import { SessionsGateway } from './sessions.gateway';

@Module({
  imports: [],
  providers: [SessionsGateway, SessionsEmitterConsumer],
})
export class SessionsModule {}
