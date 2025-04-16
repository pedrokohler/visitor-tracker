import { Module } from '@nestjs/common';
import { SessionsEmitterConsumer } from './sessions.consumer';
import { SessionsGateway } from './sessions.gateway';
import { DeanonymizerModule } from 'src/deanonymizer/deanonymizer.module';
import { SessionsController } from './sessions.controller';

@Module({
  imports: [DeanonymizerModule],
  controllers: [SessionsController],
  providers: [SessionsGateway, SessionsEmitterConsumer],
})
export class SessionsModule {}
