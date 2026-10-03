import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { Solicitacao } from '../../models/solicitacao.model.js';
import { RecomendacaoService } from './recomendacao.service.js';
import { Usuario } from '../../models/usuario.model.js';
import { ObrigacaoEmpresa } from '../../models/obrigacao-empresa.model.js';
import { Obrigacao, StatusObrigacao } from '../../models/obrigacao.model.js';
import { TipoPagamento } from '../../models/pagamento.model.js';

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

  describe('verificarRecomendacaoRegularizacaoDebitosFiscais', () => {
    const NOME_SERVICO = 'Regularização de Débitos Fiscais';

    afterEach(() => {
      vi.restoreAllMocks();
    });

    const mockEmpresaEObrigacoes = () => {
      vi.spyOn(Usuario, 'findByPk').mockResolvedValue({
        id: 1,
        empresas: [{ id: 10 }],
      } as any);
      vi.spyOn(ObrigacaoEmpresa, 'findAll').mockResolvedValue([
        { idObrigacao: 100 },
      ] as any);
    };

    it('deve recomendar quando houver obrigação pendente vinculada ao serviço', async () => {
      mockEmpresaEObrigacoes();
      vi.spyOn(Obrigacao, 'findOne').mockResolvedValue({
        id: 100,
        status: StatusObrigacao.PENDENTE,
        obrigacaoServico: {
          servico: {
            id: 6,
            nome: NOME_SERVICO,
            descricao: 'Regularização de débitos tributários da empresa',
          },
        },
      } as any);

      const resultado =
        await service.verificarRecomendacaoRegularizacaoDebitosFiscais(1);

      expect(resultado).toEqual({
        id: 6,
        nome: NOME_SERVICO,
        descricao: 'Regularização de débitos tributários da empresa',
      });
    });

    it('deve utilizar corretamente os relacionamentos entre empresa, obrigação e serviço', async () => {
      const findByPk = vi.spyOn(Usuario, 'findByPk').mockResolvedValue({
        id: 1,
        empresas: [{ id: 10 }],
      } as any);
      const findAllOE = vi
        .spyOn(ObrigacaoEmpresa, 'findAll')
        .mockResolvedValue([{ idObrigacao: 100 }, { idObrigacao: 101 }] as any);
      const findOne = vi.spyOn(Obrigacao, 'findOne').mockResolvedValue(null);

      await service.verificarRecomendacaoRegularizacaoDebitosFiscais(1);

      expect(findByPk).toHaveBeenCalledWith(1, { include: ['empresas'] });
      expect(findAllOE).toHaveBeenCalledWith({ where: { idEmpresa: 10 } });
      expect(findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: [100, 101], status: StatusObrigacao.PENDENTE },
          include: [
            expect.objectContaining({
              as: 'obrigacaoServico',
              required: true,
              include: [
                expect.objectContaining({
                  as: 'servico',
                  where: { nome: NOME_SERVICO },
                  required: true,
                }),
              ],
            }),
          ],
        }),
      );
    });

    it('deve retornar os dados somente no formato id, nome e descricao', async () => {
      mockEmpresaEObrigacoes();
      vi.spyOn(Obrigacao, 'findOne').mockResolvedValue({
        id: 100,
        obrigacaoServico: {
          servico: {
            id: 6,
            nome: NOME_SERVICO,
            descricao: 'Desc',
            valorBase: 500,
            ativo: true,
          },
        },
      } as any);

      const resultado =
        await service.verificarRecomendacaoRegularizacaoDebitosFiscais(1);

      expect(Object.keys(resultado!)).toEqual(['id', 'nome', 'descricao']);
    });

    it('deve retornar null quando não existir obrigação que atenda à condição', async () => {
      mockEmpresaEObrigacoes();
      vi.spyOn(Obrigacao, 'findOne').mockResolvedValue(null);

      const resultado =
        await service.verificarRecomendacaoRegularizacaoDebitosFiscais(1);

      expect(resultado).toBeNull();
    });

    it('não deve recomendar quando a obrigação relacionada não estiver pendente', async () => {
      mockEmpresaEObrigacoes();
      // O filtro status = pendente é aplicado no banco, que não retorna a obrigação paga
      const findOne = vi.spyOn(Obrigacao, 'findOne').mockResolvedValue(null);

      const resultado =
        await service.verificarRecomendacaoRegularizacaoDebitosFiscais(1);

      expect(findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: StatusObrigacao.PENDENTE }),
        }),
      );
      expect(resultado).toBeNull();
    });

    it('deve retornar null se o usuário não tiver empresa associada', async () => {
      vi.spyOn(Usuario, 'findByPk').mockResolvedValue({
        id: 1,
        empresas: [],
      } as any);

      expect(
        await service.verificarRecomendacaoRegularizacaoDebitosFiscais(1),
      ).toBeNull();
    });

    it('deve retornar null se a empresa não tiver obrigações cadastradas', async () => {
      vi.spyOn(Usuario, 'findByPk').mockResolvedValue({
        id: 1,
        empresas: [{ id: 10 }],
      } as any);
      vi.spyOn(ObrigacaoEmpresa, 'findAll').mockResolvedValue([]);

      expect(
        await service.verificarRecomendacaoRegularizacaoDebitosFiscais(1),
      ).toBeNull();
    });
  });

  describe('verificarRecomendacaoParcelamentoDebitosFiscais', () => {
    const NOME_SERVICO = 'Parcelamento de Débitos Fiscais';

    afterEach(() => {
      vi.restoreAllMocks();
    });

    const mockEmpresaEObrigacoes = () => {
      vi.spyOn(Usuario, 'findByPk').mockResolvedValue({
        id: 1,
        empresas: [{ id: 10 }],
      } as any);
      vi.spyOn(ObrigacaoEmpresa, 'findAll').mockResolvedValue([
        { idObrigacao: 100 },
      ] as any);
    };

    it('deve recomendar quando houver obrigação pendente do serviço sem pagamento parcelado', async () => {
      mockEmpresaEObrigacoes();
      vi.spyOn(Obrigacao, 'findAll').mockResolvedValue([
        {
          id: 100,
          status: StatusObrigacao.PENDENTE,
          pagamento: null,
          obrigacaoServico: {
            servico: {
              id: 7,
              nome: NOME_SERVICO,
              descricao: 'Negociação/parcelamento de débitos existentes',
            },
          },
        },
      ] as any);

      const resultado =
        await service.verificarRecomendacaoParcelamentoDebitosFiscais(1);

      expect(resultado).toEqual({
        id: 7,
        nome: NOME_SERVICO,
        descricao: 'Negociação/parcelamento de débitos existentes',
      });
    });

    it('deve retornar os dados somente no formato id, nome e descricao', async () => {
      mockEmpresaEObrigacoes();
      vi.spyOn(Obrigacao, 'findAll').mockResolvedValue([
        {
          id: 100,
          pagamento: null,
          obrigacaoServico: {
            servico: {
              id: 7,
              nome: NOME_SERVICO,
              descricao: 'Desc',
              valorBase: 500,
              ativo: true,
            },
          },
        },
      ] as any);

      const resultado =
        await service.verificarRecomendacaoParcelamentoDebitosFiscais(1);

      expect(Object.keys(resultado!)).toEqual(['id', 'nome', 'descricao']);
    });

    it('deve consultar obrigações pendentes, o serviço correto e pagamento parcelado', async () => {
      mockEmpresaEObrigacoes();
      const findAll = vi.spyOn(Obrigacao, 'findAll').mockResolvedValue([]);

      await service.verificarRecomendacaoParcelamentoDebitosFiscais(1);

      expect(findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: [100], status: StatusObrigacao.PENDENTE },
          include: [
            expect.objectContaining({
              as: 'obrigacaoServico',
              required: true,
              include: [
                expect.objectContaining({
                  as: 'servico',
                  where: { nome: NOME_SERVICO },
                  required: true,
                }),
              ],
            }),
            expect.objectContaining({
              as: 'pagamento',
              where: { tipoPagamento: TipoPagamento.PARCELADO },
              required: false,
            }),
          ],
        }),
      );
    });

    it('deve retornar null quando não existir obrigação que atenda à condição', async () => {
      mockEmpresaEObrigacoes();
      vi.spyOn(Obrigacao, 'findAll').mockResolvedValue([]);

      const resultado =
        await service.verificarRecomendacaoParcelamentoDebitosFiscais(1);

      expect(resultado).toBeNull();
    });

    it('não deve recomendar quando a obrigação não estiver pendente', async () => {
      mockEmpresaEObrigacoes();
      // O filtro status = pendente é aplicado no banco, que não retorna a obrigação paga
      const findAll = vi.spyOn(Obrigacao, 'findAll').mockResolvedValue([]);

      const resultado =
        await service.verificarRecomendacaoParcelamentoDebitosFiscais(1);

      expect(findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: StatusObrigacao.PENDENTE }),
        }),
      );
      expect(resultado).toBeNull();
    });

    it('não deve recomendar quando existir pagamento parcelado para a obrigação', async () => {
      mockEmpresaEObrigacoes();
      vi.spyOn(Obrigacao, 'findAll').mockResolvedValue([
        {
          id: 100,
          status: StatusObrigacao.PENDENTE,
          pagamento: { id: 1, tipoPagamento: TipoPagamento.PARCELADO },
          obrigacaoServico: {
            servico: { id: 7, nome: NOME_SERVICO, descricao: 'Desc' },
          },
        },
      ] as any);

      const resultado =
        await service.verificarRecomendacaoParcelamentoDebitosFiscais(1);

      expect(resultado).toBeNull();
    });

    it('deve recomendar se outra obrigação não tiver pagamento parcelado', async () => {
      mockEmpresaEObrigacoes();
      const servico = { id: 7, nome: NOME_SERVICO, descricao: 'Desc' };
      vi.spyOn(Obrigacao, 'findAll').mockResolvedValue([
        {
          id: 100,
          pagamento: { id: 1, tipoPagamento: TipoPagamento.PARCELADO },
          obrigacaoServico: { servico },
        },
        { id: 101, pagamento: null, obrigacaoServico: { servico } },
      ] as any);

      const resultado =
        await service.verificarRecomendacaoParcelamentoDebitosFiscais(1);

      expect(resultado).toEqual({
        id: 7,
        nome: NOME_SERVICO,
        descricao: 'Desc',
      });
    });

    it('deve retornar null se o usuário não tiver empresa associada', async () => {
      vi.spyOn(Usuario, 'findByPk').mockResolvedValue({
        id: 1,
        empresas: [],
      } as any);

      expect(
        await service.verificarRecomendacaoParcelamentoDebitosFiscais(1),
      ).toBeNull();
    });

    it('deve retornar null se a empresa não tiver obrigações cadastradas', async () => {
      vi.spyOn(Usuario, 'findByPk').mockResolvedValue({
        id: 1,
        empresas: [{ id: 10 }],
      } as any);
      vi.spyOn(ObrigacaoEmpresa, 'findAll').mockResolvedValue([]);

      expect(
        await service.verificarRecomendacaoParcelamentoDebitosFiscais(1),
      ).toBeNull();
    });
  });
});
