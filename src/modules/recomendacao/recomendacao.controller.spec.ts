import { Test, TestingModule } from '@nestjs/testing';
import { RecomendacaoController } from './recomendacao.controller.js';
import { RecomendacaoService } from './recomendacao.service.js';

describe('RecomendacaoController', () => {
  let controller: RecomendacaoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecomendacaoController],
      providers: [RecomendacaoService],
    }).compile();

    controller = module.get<RecomendacaoController>(RecomendacaoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});