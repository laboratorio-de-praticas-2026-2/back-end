import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { BadRequestException } from '@nestjs/common';
import { ServicosService } from './servicos.service.js';
import { Servico } from '../../models/servico.model.js';
import { Solicitacao } from '../../models/solicitacao.model.js';
import { Parcela } from '../../models/parcela.model.js';
import { Pagamento } from '../../models/pagamento.model.js';
import { Obrigacao } from '../../models/obrigacao.model.js';
import { ObrigacaoServico } from '../../models/obrigacao-servico.model.js';

describe('ServicosService', () => {
  let service: ServicosService;
  let mockServicoModel: any;
  let mockSolicitacaoModel: any;
  let mockParcelaModel: any;
  let mockPagamentoModel: any;
  let mockObrigacaoModel: any;
  let mockObrigacaoServicoModel: any;

  beforeEach(async () => {
    mockServicoModel = {
      count: vi.fn().mockResolvedValue(0),
      findAll: vi.fn().mockResolvedValue([]),
    };
    mockSolicitacaoModel = { findAll: vi.fn().mockResolvedValue([]) };
    mockParcelaModel = { findAll: vi.fn().mockResolvedValue([]) };
    mockPagamentoModel = { findAll: vi.fn().mockResolvedValue([]) };
    mockObrigacaoModel = { findAll: vi.fn().mockResolvedValue([]) };
    mockObrigacaoServicoModel = { findAll: vi.fn().mockResolvedValue([]) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicosService,
        { provide: getModelToken(Servico), useValue: mockServicoModel },
        { provide: getModelToken(Solicitacao), useValue: mockSolicitacaoModel },
        { provide: getModelToken(Parcela), useValue: mockParcelaModel },
        { provide: getModelToken(Pagamento), useValue: mockPagamentoModel },
        { provide: getModelToken(Obrigacao), useValue: mockObrigacaoModel },
        {
          provide: getModelToken(ObrigacaoServico),
          useValue: mockObrigacaoServicoModel,
        },
      ],
    }).compile();

    service = module.get<ServicosService>(ServicosService);
  });

  describe('getIndicadores', () => {
    it('deve retornar zeros e listas vazias sem dados', async () => {
      const result = await service.getIndicadores();
      expect(result.statusServicos).toEqual({
        ativos: 0,
        pausados: 0,
        total: 0,
      });
      expect(result.faturamentoPorServico).toEqual([]);
      expect(result.demandasMaisSolicitadas).toEqual([]);
    });

    it('deve lancar 400 quando apenas startDate e enviado', async () => {
      await expect(service.getIndicadores('2026-09-01')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve lancar 400 quando startDate > endDate', async () => {
      await expect(
        service.getIndicadores('2026-09-30', '2026-09-01'),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve contar ativos e pausados', async () => {
      mockServicoModel.count
        .mockResolvedValueOnce(20)  // ativos
        .mockResolvedValueOnce(8);  // pausados

      const result = await service.getIndicadores();
      expect(result.statusServicos).toEqual({
        ativos: 20,
        pausados: 8,
        total: 28,
      });
    });

    it('deve agrupar demandas por servico e ordenar', async () => {
      mockSolicitacaoModel.findAll.mockResolvedValue([
        { id: 1, servicoId: 1, status: 'concluido' },
        { id: 2, servicoId: 1, status: 'em_andamento' },
        { id: 3, servicoId: 1, status: 'recebido' },
        { id: 4, servicoId: 2, status: 'concluido' },
      ]);

      mockServicoModel.findAll.mockResolvedValueOnce([
        { id: 1, nome: 'Contabilidade' },
        { id: 2, nome: 'IRPF' },
      ]);

      const result = await service.getIndicadores();
      expect(result.demandasMaisSolicitadas).toEqual([
        { servicoId: 1, servicoNome: 'Contabilidade', quantidade: 3 },
        { servicoId: 2, servicoNome: 'IRPF', quantidade: 1 },
      ]);
    });

    it('nao deve contar solicitacoes sem servico encontrado', async () => {
      mockSolicitacaoModel.findAll.mockResolvedValue([
        { id: 1, servicoId: 99, status: 'recebido' },
      ]);
      mockServicoModel.findAll.mockResolvedValueOnce([]);

      const result = await service.getIndicadores();
      expect(result.demandasMaisSolicitadas).toEqual([]);
    });
  });
});