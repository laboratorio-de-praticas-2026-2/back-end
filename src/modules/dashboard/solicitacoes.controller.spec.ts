import { Test, TestingModule } from '@nestjs/testing';
import { SolicitacoesController } from './solicitacoes.controller.js';

describe('SolicitacoesController', () => {
  let controller: SolicitacoesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SolicitacoesController],
    }).compile();

    controller = module.get<SolicitacoesController>(SolicitacoesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
