import { Module } from '@nestjs/common';
import { DeanonymizerService } from './deanonymizer.service';

@Module({
  providers: [DeanonymizerService]
})
export class DeanonymizerModule {}
