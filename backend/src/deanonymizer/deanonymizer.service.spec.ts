import { Test, TestingModule } from '@nestjs/testing';
import { DeanonymizerService } from './deanonymizer.service';

describe('DeanonymizerService', () => {
  let service: DeanonymizerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DeanonymizerService],
    }).compile();

    service = module.get<DeanonymizerService>(DeanonymizerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
