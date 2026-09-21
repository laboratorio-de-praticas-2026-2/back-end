import { Test, TestingModule } from '@nestjs/testing';
import { NotificacaoController } from './notificacao.controller.js';
import { NotificacaoService } from './notificacao.service.js';

describe('NotificacaoController', () => {
  let controller: NotificacaoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificacaoController],
      providers: [NotificacaoService],
    }).compile();

    controller = module.get<NotificacaoController>(NotificacaoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});