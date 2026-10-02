import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { Solicitacao } from '../../models/solicitacao.model.js';
import { RecomendacaoService } from './recomendacao.service.js';
import { Usuario } from '../../models/usuario.model.js';
import { ObrigacaoEmpresa } from '../../models/obrigacao-empresa.model.js';
import { Obrigacao } from '../../models/obrigacao.model.js';

describe('RecomendacaoService', () => {
  let service: RecomendacaoService;

  const solicitacaoModelMock = {
    findAll: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecomendacaoService,
        {
          provide: getModelToken(Solicitacao),
          useValue: solicitacaoModelMock,
        },
      ],
    }).compile();

    service = module.get<RecomendacaoService>(RecomendacaoService);

    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('buscarServicosPopulares', () => {
    it('deve retornar os serviços ordenados pela quantidade de solicitações', async () => {
      const a = { id: 1, nome: 'Serviço A', descricao: 'Desc A' };
      const b = { id: 2, nome: 'Serviço B', descricao: 'Desc B' };
      const c = { id: 3, nome: 'Serviço C', descricao: 'Desc C' };

      solicitacaoModelMock.findAll.mockResolvedValue([
        { servico: a },
        { servico: b },
        { servico: c },
        { servico: b },
        { servico: c },
        { servico: b },
      ]);

      const resultado = await service.buscarServicosPopulares();

      expect(resultado.map((s) => s.id)).toEqual([2, 3, 1]);
    });

    it('deve consultar somente serviços ativos', async () => {
      solicitacaoModelMock.findAll.mockResolvedValue([]);

      await service.buscarServicosPopulares();

      expect(solicitacaoModelMock.findAll).toHaveBeenCalledWith({
        include: [
          {
            association: 'servico',
            attributes: ['id', 'nome', 'descricao'],
            where: { ativo: true },
            required: true,
          },
        ],
      });
    });

    it('deve retornar somente id, nome e descricao, sem a quantidade', async () => {
      const servico = {
        id: 1,
        nome: 'Abertura de empresa',
        descricao: 'Abertura de CNPJ',
      };

      solicitacaoModelMock.findAll.mockResolvedValue([
        { servico },
        { servico },
      ]);

      const resultado = await service.buscarServicosPopulares();

      expect(resultado).toEqual([
        { id: 1, nome: 'Abertura de empresa', descricao: 'Abertura de CNPJ' },
      ]);
      expect(Object.keys(resultado[0])).toEqual(['id', 'nome', 'descricao']);
    });

    it('deve retornar array vazio quando não existirem solicitações', async () => {
      solicitacaoModelMock.findAll.mockResolvedValue([]);

      const resultado = await service.buscarServicosPopulares();

      expect(resultado).toEqual([]);
    });
  });

  describe('buscarAtributosPerfil', () => {
    it('deve retornar um array de objetos no formato definido, convertendo ativo em status', async () => {
      solicitacaoModelMock.findAll.mockResolvedValue([
        {
          servico: {
            nome: 'Abertura de empresa',
            descricao: 'Abertura de CNPJ',
            valorBase: 350,
            ativo: true,
          },
        },
        {
          servico: {
            nome: 'Declaração de IR',
            descricao: null,
            valorBase: null,
            ativo: false,
          },
        },
      ]);

      const resultado = await service.buscarAtributosPerfil(1);

      expect(solicitacaoModelMock.findAll).toHaveBeenCalledWith({
        where: { usuarioId: 1 },
        include: [
          {
            association: 'servico',
            attributes: ['nome', 'descricao', 'valorBase', 'ativo'],
          },
        ],
      });

      expect(resultado).toEqual([
        {
          nome: 'Abertura de empresa',
          descricao: 'Abertura de CNPJ',
          valorBase: 350,
          status: 'ativo',
        },
        {
          nome: 'Declaração de IR',
          descricao: null,
          valorBase: null,
          status: 'inativo',
        },
      ]);
    });

    it('deve retornar array vazio quando o usuário não tem solicitações', async () => {
      solicitacaoModelMock.findAll.mockResolvedValue([]);

      const resultado = await service.buscarAtributosPerfil(99);

      expect(resultado).toEqual([]);
    });
  });

  describe('verificarRecomendacaoRegularizacaoObrigacoesFiscais', () => {
    it('deve retornar a recomendação com { id, nome, descricao } quando houver obrigação pendente vinculada ao serviço', async () => {
      vi.spyOn(Usuario, 'findByPk').mockResolvedValue({
        id: 1,
        empresas: [{ id: 10 }],
      } as any);

      vi.spyOn(ObrigacaoEmpresa, 'findAll').mockResolvedValue([
        { idObrigacao: 100 } as any,
      ]);

      vi.spyOn(Obrigacao, 'findOne').mockResolvedValue({
        id: 100,
        status: 'pendente',
        obrigacaoServico: {
          servico: {
            id: 5,
            nome: 'Regularização de Obrigações Fiscais',
            descricao: 'Serviço para regularizar débitos fiscais',
          },
        },
      } as any);

      const resultado =
        await service.verificarRecomendacaoRegularizacaoObrigacoesFiscais(1);

      expect(resultado).toEqual({
        id: 5,
        nome: 'Regularização de Obrigações Fiscais',
        descricao: 'Serviço para regularizar débitos fiscais',
      });
    });

    it('deve retornar null se o usuário não tiver empresa associada', async () => {
      vi.spyOn(Usuario, 'findByPk').mockResolvedValue({
        id: 1,
        empresas: [],
      } as any);

      const resultado =
        await service.verificarRecomendacaoRegularizacaoObrigacoesFiscais(1);

      expect(resultado).toBeNull();
    });

    it('deve retornar null se a empresa não tiver obrigações cadastradas', async () => {
      vi.spyOn(Usuario, 'findByPk').mockResolvedValue({
        id: 1,
        empresas: [{ id: 10 }],
      } as any);

      vi.spyOn(ObrigacaoEmpresa, 'findAll').mockResolvedValue([]);

      const resultado =
        await service.verificarRecomendacaoRegularizacaoObrigacoesFiscais(1);

      expect(resultado).toBeNull();
    });

    it('deve retornar null quando nenhuma obrigação pendente atender ao serviço de Regularização de Obrigações Fiscais', async () => {
      vi.spyOn(Usuario, 'findByPk').mockResolvedValue({
        id: 1,
        empresas: [{ id: 10 }],
      } as any);

      vi.spyOn(ObrigacaoEmpresa, 'findAll').mockResolvedValue([
        { idObrigacao: 100 },
      ] as any);

      vi.spyOn(Obrigacao, 'findOne').mockResolvedValue(null);

      const resultado =
        await service.verificarRecomendacaoRegularizacaoObrigacoesFiscais(1);

      expect(resultado).toBeNull();
    });
  });

  describe('recomendarRevisaoRegime', () => {
    it('deve retornar null se o usuário não tiver empresa associada', async () => {
      vi.spyOn(Usuario, 'findByPk').mockResolvedValue({
        id: 1,
        empresas: [],
      } as any);

      const resultado = await service.recomendarRevisaoRegime(1);

      expect(resultado).toBeNull();
    });

    it('deve retornar null se o usuário não for encontrado', async () => {
      vi.spyOn(Usuario, 'findByPk').mockResolvedValue(null);

      const resultado = await service.recomendarRevisaoRegime(99);

      expect(resultado).toBeNull();
    });

    it('deve retornar null se a empresa não possuir vínculos na tabela obrigacao_empresa', async () => {
      vi.spyOn(Usuario, 'findByPk').mockResolvedValue({
        id: 2,
        empresas: [{ id: 1 }],
      } as any);

      vi.spyOn(ObrigacaoEmpresa, 'findAll').mockResolvedValue([]);

      const resultado = await service.recomendarRevisaoRegime(2);

      expect(resultado).toBeNull();
    });

    it('deve retornar null se houver menos de 3 competências distintas pendentes', async () => {
      vi.spyOn(Usuario, 'findByPk').mockResolvedValue({
        id: 2,
        empresas: [{ id: 1 }],
      } as any);

      vi.spyOn(ObrigacaoEmpresa, 'findAll').mockResolvedValue([
        { idObrigacao: 10 },
        { idObrigacao: 20 },
      ] as any);

      vi.spyOn(Obrigacao, 'findAll').mockResolvedValue([
        { id: 10, competencia: '2026-08-01', status: 'pendente' },
        { id: 20, competencia: '2026-08-01', status: 'pendente' }, // mesma competência
      ] as any);

      const resultado = await service.recomendarRevisaoRegime(2);

      expect(resultado).toBeNull();
    });

    it('deve retornar a recomendação quando existirem 3 ou mais competências distintas pendentes', async () => {
      vi.spyOn(Usuario, 'findByPk').mockResolvedValue({
        id: 2,
        empresas: [{ id: 1 }],
      } as any);

      vi.spyOn(ObrigacaoEmpresa, 'findAll').mockResolvedValue([
        { idObrigacao: 10 },
        { idObrigacao: 20 },
        { idObrigacao: 30 },
      ] as any);

      vi.spyOn(Obrigacao, 'findAll').mockResolvedValue([
        { id: 10, competencia: '2026-06-01', status: 'pendente' },
        { id: 20, competencia: '2026-07-01', status: 'pendente' },
        { id: 30, competencia: '2026-08-01', status: 'pendente' },
      ] as any);

      const resultado = await service.recomendarRevisaoRegime(2);

      expect(resultado).toEqual({
        id: 1,
        nome: 'Revisão do Regime Tributário',
        descricao: 'Análise do regime tributário atual',
      });
    });
  });
});
