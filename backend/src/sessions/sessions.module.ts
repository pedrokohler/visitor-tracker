import { Module } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { SessionsGateway } from './sessions.gateway';

@Module({
  providers: [SessionsGateway, SessionsService],
})
export class SessionsModule {}
