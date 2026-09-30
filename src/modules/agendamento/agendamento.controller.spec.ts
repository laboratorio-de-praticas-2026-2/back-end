import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { AgendamentoController } from './agendamento.controller.js';
import { AgendamentoService } from './agendamento.service.js';
import { AgendamentoModel } from '../../models/agendamento.model.js';
import { TipoAtendimentoModel } from '../../models/tipo-atendimento.model.js';
import { DisparoAgendamentoService } from './disparo/disparo.service.js';

describe('AgendamentoController', () => {
    let controller: AgendamentoController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AgendamentoController],
            providers: [
                AgendamentoService,
                { provide: getModelToken(AgendamentoModel), useValue: {} },
                { provide: getModelToken(TipoAtendimentoModel), useValue: {} },
                { provide: DisparoAgendamentoService, useValue: {} },
            ],
        }).compile();

        controller = module.get<AgendamentoController>(AgendamentoController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
