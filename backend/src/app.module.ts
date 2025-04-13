import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SessionsModule } from './sessions/sessions.module';
import { DeanonymizerModule } from './deanonymizer/deanonymizer.module';
import { CacheModule } from './cache/cache.module';

@Module({
  imports: [
    SessionsModule,
    DeanonymizerModule,
    EventEmitterModule.forRoot(),
    CacheModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
