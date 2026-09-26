import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { BadRequestException } from '@nestjs/common';
import { FiscalService } from './fiscal.service.js';
import { Obrigacao } from '../../models/obrigacao.model.js';
import { Pagamento } from '../../models/pagamento.model.js';
import { Parcela } from '../../models/parcela.model.js';

function ontemSP(): string {
  const hoje = new Date();
  hoje.setUTCDate(hoje.getUTCDate() - 2);
  return hoje.toISOString().split('T')[0];
}

function amanhaSP(): string {
  const hoje = new Date();
  hoje.setUTCDate(hoje.getUTCDate() + 2);
  return hoje.toISOString().split('T')[0];
}

describe('FiscalService', () => {
  let service: FiscalService;
  let mockObrigacaoModel: any;
  let mockPagamentoModel: any;
  let mockParcelaModel: any;

  beforeEach(async () => {
    mockObrigacaoModel = { findAll: vi.fn().mockResolvedValue([]) };
    mockPagamentoModel = { findAll: vi.fn().mockResolvedValue([]) };
    mockParcelaModel = { findAll: vi.fn().mockResolvedValue([]) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FiscalService,
        { provide: getModelToken(Obrigacao), useValue: mockObrigacaoModel },
        { provide: getModelToken(Pagamento), useValue: mockPagamentoModel },
        { provide: getModelToken(Parcela), useValue: mockParcelaModel },
      ],
    }).compile();

    service = module.get<FiscalService>(FiscalService);
  });

  describe('getIndicadores', () => {
    it('deve retornar zeros quando nao ha obrigacoes', async () => {
      const result = await service.getIndicadores();
      expect(result.guias.totalGeradas).toBe(0);
      expect(result.guias.totalPendentes).toBe(0);
      expect(result.guias.impostosEmAtraso).toBe(0);
      expect(result.volumeImpostosAtraso.valorTotal).toBe(0);
      expect(result.volumeImpostosAtraso.distribuicao).toEqual([]);
    });

    it('deve lancar 400 quando apenas startDate e enviado', async () => {
      await expect(service.getIndicadores('2026-09-01')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve lancar 400 quando apenas endDate e enviado', async () => {
      await expect(
        service.getIndicadores(undefined, '2026-09-30'),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lancar 400 para data invalida', async () => {
      await expect(
        service.getIndicadores('2026-13-01', '2026-13-30'),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lancar 400 quando startDate > endDate', async () => {
      await expect(
        service.getIndicadores('2026-09-30', '2026-09-01'),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve contar obrigacoes pendentes', async () => {
      mockObrigacaoModel.findAll.mockResolvedValue([
        { id: 1, status: 'pendente', valor: 100, vencimento: null, descricao: 'DAS' },
        { id: 2, status: 'pago', valor: 200, vencimento: null, descricao: 'INSS' },
      ]);

      const result = await service.getIndicadores();
      expect(result.guias.totalGeradas).toBe(2);
      expect(result.guias.totalPendentes).toBe(1);
    });

    it('deve ignorar vencimentos futuros', async () => {
      mockObrigacaoModel.findAll.mockResolvedValue([
        {
          id: 1,
          status: 'pendente',
          valor: 100,
          vencimento: amanhaSP(),
          descricao: 'DAS',
        },
      ]);

      const result = await service.getIndicadores();
      expect(result.guias.impostosEmAtraso).toBe(0);
    });

    it('deve somar obrigacoes vencidas sem pagamento', async () => {
      mockObrigacaoModel.findAll.mockResolvedValue([
        {
          id: 1,
          status: 'pendente',
          valor: 500,
          vencimento: ontemSP(),
          descricao: 'DAS',
        },
      ]);

      const result = await service.getIndicadores();
      expect(result.guias.impostosEmAtraso).toBe(1);
      expect(result.volumeImpostosAtraso.valorTotal).toBe(500);
      expect(result.volumeImpostosAtraso.distribuicao[0].imposto).toBe('DAS');
    });

    it('deve agrupar descricoes vazias como "Sem descricao"', async () => {
      mockObrigacaoModel.findAll.mockResolvedValue([
        {
          id: 1,
          status: 'pendente',
          valor: 100,
          vencimento: ontemSP(),
          descricao: null,
        },
        {
          id: 2,
          status: 'pendente',
          valor: 200,
          vencimento: ontemSP(),
          descricao: '   ',
        },
      ]);

      const result = await service.getIndicadores();
      expect(result.volumeImpostosAtraso.distribuicao[0].imposto).toBe(
        'Sem descricao',
      );
      expect(result.volumeImpostosAtraso.valorTotal).toBe(300);
    });

    it('deve somar parcelas vencidas nao pagas', async () => {
      mockObrigacaoModel.findAll.mockResolvedValue([
        {
          id: 1,
          status: 'pendente',
          valor: 1000,
          vencimento: ontemSP(),
          descricao: 'Parcelado',
        },
      ]);

      mockPagamentoModel.findAll.mockResolvedValue([
        { id: 1, idObrigacao: 1 },
      ]);

      mockParcelaModel.findAll.mockResolvedValue([
        {
          id: 1,
          idPagamento: 1,
          valor: 300,
          status: 'pago',
          vencimento: ontemSP(),
        },
        {
          id: 2,
          idPagamento: 1,
          valor: 300,
          status: 'ativo',
          vencimento: ontemSP(),
        },
        {
          id: 3,
          idPagamento: 1,
          valor: 400,
          status: 'ativo',
          vencimento: amanhaSP(),
        },
      ]);

      const result = await service.getIndicadores();
      expect(result.volumeImpostosAtraso.valorTotal).toBe(300);
    });
  });
});