import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AgendamentoService } from './agendamento.service.js';
import { AgendamentoModel } from '../../models/agendamento.model.js';
import { TipoAtendimentoModel } from '../../models/tipo-atendimento.model.js';
import { DisparoAgendamentoService } from './disparo/disparo.service.js';

describe('AgendamentoService', () => {
    let service: AgendamentoService;
    const agendamentoModel = {
        findAll: vi.fn().mockImplementation(({ where }: { where: { tipoAtendimentoId: number } }) =>
            Promise.resolve(where.tipoAtendimentoId === 1
                ? [{ horario: '11:00' }, { horario: '14:00' }]
                : [])),
    };
    const tipoAtendimentoModel = {
        findOne: vi.fn().mockImplementation(({ where }: { where: { id: number } }) =>
            Promise.resolve(where.id === 999 ? null : { id: where.id, ativo: true })),
    };

    beforeEach(async () => {
        vi.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AgendamentoService,
                { provide: getModelToken(AgendamentoModel), useValue: agendamentoModel },
                { provide: getModelToken(TipoAtendimentoModel), useValue: tipoAtendimentoModel },
                { provide: DisparoAgendamentoService, useValue: {} },
            ],
        }).compile();

        service = module.get<AgendamentoService>(AgendamentoService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('listarHorariosDisponiveis', () => {
        it('deve retornar os horários livres, removendo os já agendados', async () => {
            // 2026-10-01 é uma quinta-feira; 11:00 e 14:00 já estão
            // confirmados no seed para o tipo_atendimento_id 1
            const resultado = await service.listarHorariosDisponiveis('2026-10-01', 1);

            expect(resultado.data).toBe('2026-10-01');
            expect(resultado.tipo_atendimento_id).toBe(1);
            expect(resultado.horarios_disponiveis).not.toContain('11:00');
            expect(resultado.horarios_disponiveis).not.toContain('14:00');
            expect(resultado.horarios_disponiveis).toContain('09:00');
        });

        it('não deve remover horários ocupados de outro tipo de atendimento', async () => {
            const resultado = await service.listarHorariosDisponiveis('2026-10-01', 2);

            expect(resultado.horarios_disponiveis).toContain('11:00');
            expect(resultado.horarios_disponiveis).toContain('14:00');
        });

        it('deve retornar lista vazia em um dia sem expediente (domingo)', async () => {
            const resultado = await service.listarHorariosDisponiveis('2026-10-04', 1);

            expect(resultado.horarios_disponiveis).toEqual([]);
        });

        it('deve lançar NotFoundException para tipo de atendimento inexistente', async () => {
            await expect(service.listarHorariosDisponiveis('2026-10-01', 999)).rejects.toThrow(NotFoundException);
        });

        it('deve lançar BadRequestException para data em formato inválido', async () => {
            await expect(service.listarHorariosDisponiveis('01-10-2026', 1)).rejects.toThrow(BadRequestException);
        });
    });
});