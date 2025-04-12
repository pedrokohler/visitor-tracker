import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DeanonymizerService } from './deanonymizer.service';

@Module({
  exports: [DeanonymizerService],
  imports: [HttpModule],
  providers: [DeanonymizerService],
})
export class DeanonymizerModule {}
