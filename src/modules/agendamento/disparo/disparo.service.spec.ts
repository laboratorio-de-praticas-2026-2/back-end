import { Test, TestingModule } from '@nestjs/testing';
import { DisparoService } from './disparo.service.js';

describe('DisparoService', () => {
  let service: DisparoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DisparoService],
    }).compile();

    service = module.get<DisparoService>(DisparoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
