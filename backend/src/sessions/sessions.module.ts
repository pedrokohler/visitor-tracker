import { Module } from '@nestjs/common';
import { SessionsEmitterConsumer } from './sessionsEmitter.consumer';
import { SessionsGateway } from './sessions.gateway';
import { DeanonymizerModule } from 'src/deanonymizer/deanonymizer.module';

@Module({
  imports: [DeanonymizerModule],
  providers: [SessionsGateway, SessionsEmitterConsumer],
})
export class SessionsModule {}
