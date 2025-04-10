import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SessionsModule } from './sessions/sessions.module';
import { DeanonymizerModule } from './deanonymizer/deanonymizer.module';

@Module({
  imports: [SessionsModule, DeanonymizerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
