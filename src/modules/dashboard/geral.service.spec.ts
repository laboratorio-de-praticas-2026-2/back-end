import { Test, TestingModule } from '@nestjs/testing';
import { GeralService } from './geral.service.js';

describe('GeralService', () => {
  let service: GeralService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GeralService],
    }).compile();

    service = module.get<GeralService>(GeralService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
