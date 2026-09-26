import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AgendamentoService } from './agendamento.service.js';

describe('AgendamentoService', () => {
    let service: AgendamentoService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [AgendamentoService],
        }).compile();

        service = module.get<AgendamentoService>(AgendamentoService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('listarHorariosDisponiveis', () => {
        it('deve retornar os horários livres, removendo os já agendados', () => {
            // 2026-10-01 é uma quinta-feira; 11:00 e 14:00 já estão
            // confirmados no seed para o tipo_atendimento_id 1
            const resultado = service.listarHorariosDisponiveis('2026-10-01', 1);

            expect(resultado.data).toBe('2026-10-01');
            expect(resultado.tipo_atendimento_id).toBe(1);
            expect(resultado.horarios_disponiveis).not.toContain('11:00');
            expect(resultado.horarios_disponiveis).not.toContain('14:00');
            expect(resultado.horarios_disponiveis).toContain('09:00');
        });

        it('não deve remover horários ocupados de outro tipo de atendimento', () => {
            const resultado = service.listarHorariosDisponiveis('2026-10-01', 2);

            expect(resultado.horarios_disponiveis).toContain('11:00');
            expect(resultado.horarios_disponiveis).toContain('14:00');
        });

        it('deve retornar lista vazia em um dia sem expediente (domingo)', () => {
            const resultado = service.listarHorariosDisponiveis('2026-10-04', 1);

            expect(resultado.horarios_disponiveis).toEqual([]);
        });

        it('deve lançar NotFoundException para tipo de atendimento inexistente', () => {
            expect(() => service.listarHorariosDisponiveis('2026-10-01', 999)).toThrow(
                NotFoundException,
            );
        });

        it('deve lançar BadRequestException para data em formato inválido', () => {
            expect(() => service.listarHorariosDisponiveis('01-10-2026', 1)).toThrow(
                BadRequestException,
            );
        });
    });
});