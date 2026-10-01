import { Test, TestingModule } from '@nestjs/testing';
import { DisparoAgendamentoService } from './disparo.service.js';

describe('DisparoAgendamentoService', () => {
  let service: DisparoAgendamentoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DisparoAgendamentoService],
    }).compile();

    service = module.get<DisparoAgendamentoService>(DisparoAgendamentoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
