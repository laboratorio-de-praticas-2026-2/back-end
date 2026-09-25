import { Test, TestingModule } from '@nestjs/testing';
import { AgendamentoController } from './agendamento.controller.js';
import { AgendamentoService } from './agendamento.service.js';

describe('AgendamentoController', () => {
    let controller: AgendamentoController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AgendamentoController],
            providers: [AgendamentoService],
        }).compile();

        controller = module.get<AgendamentoController>(AgendamentoController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
