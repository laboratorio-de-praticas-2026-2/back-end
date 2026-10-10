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

  describe('verificarRecomendacaoRecursoMultaInfracaoFiscal', () => {
    const NOME_SERVICO = 'Recurso de Multa/Infração Fiscal';

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
            id: 8,
            nome: NOME_SERVICO,
            descricao: 'Contestação de multas ou infrações fiscais',
          },
        },
      } as any);

      const resultado =
        await service.verificarRecomendacaoRecursoMultaInfracaoFiscal(1);

      expect(resultado).toEqual({
        id: 8,
        nome: NOME_SERVICO,
        descricao: 'Contestação de multas ou infrações fiscais',
      });
    });

    it('deve retornar os dados somente no formato id, nome e descricao', async () => {
      mockEmpresaEObrigacoes();
      vi.spyOn(Obrigacao, 'findOne').mockResolvedValue({
        id: 100,
        obrigacaoServico: {
          servico: {
            id: 8,
            nome: NOME_SERVICO,
            descricao: 'Desc',
            valorBase: 500,
            ativo: true,
          },
        },
      } as any);

      const resultado =
        await service.verificarRecomendacaoRecursoMultaInfracaoFiscal(1);

      expect(Object.keys(resultado!)).toEqual(['id', 'nome', 'descricao']);
    });

    it('deve consultar obrigações pendentes relacionadas ao serviço correto via OBRIGACAO_SERVICO', async () => {
      mockEmpresaEObrigacoes();
      const findOne = vi.spyOn(Obrigacao, 'findOne').mockResolvedValue(null);

      await service.verificarRecomendacaoRecursoMultaInfracaoFiscal(1);

      expect(findOne).toHaveBeenCalledWith(
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
          ],
        }),
      );
    });

    it('deve retornar null quando não existir obrigação que atenda à condição', async () => {
      mockEmpresaEObrigacoes();
      vi.spyOn(Obrigacao, 'findOne').mockResolvedValue(null);

      const resultado =
        await service.verificarRecomendacaoRecursoMultaInfracaoFiscal(1);

      expect(resultado).toBeNull();
    });

    it('não deve recomendar quando a obrigação não estiver pendente', async () => {
      mockEmpresaEObrigacoes();
      // O filtro status = pendente é aplicado no banco, que não retorna a obrigação paga
      const findOne = vi.spyOn(Obrigacao, 'findOne').mockResolvedValue(null);

      const resultado =
        await service.verificarRecomendacaoRecursoMultaInfracaoFiscal(1);

      expect(findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: StatusObrigacao.PENDENTE }),
        }),
      );
      expect(resultado).toBeNull();
    });

    it('não deve recomendar quando a obrigação não estiver relacionada ao serviço', async () => {
      mockEmpresaEObrigacoes();
      // O filtro por nome do serviço é aplicado no banco (include com required: true)
      const findOne = vi.spyOn(Obrigacao, 'findOne').mockResolvedValue(null);

      const resultado =
        await service.verificarRecomendacaoRecursoMultaInfracaoFiscal(1);

      expect(findOne).toHaveBeenCalledWith(
        expect.objectContaining({
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
      expect(resultado).toBeNull();
    });

    it('deve retornar null se o usuário não tiver empresa associada', async () => {
      vi.spyOn(Usuario, 'findByPk').mockResolvedValue({
        id: 1,
        empresas: [],
      } as any);

      expect(
        await service.verificarRecomendacaoRecursoMultaInfracaoFiscal(1),
      ).toBeNull();
    });

    it('deve retornar null se a empresa não tiver obrigações cadastradas', async () => {
      vi.spyOn(Usuario, 'findByPk').mockResolvedValue({
        id: 1,
        empresas: [{ id: 10 }],
      } as any);
      vi.spyOn(ObrigacaoEmpresa, 'findAll').mockResolvedValue([]);

      expect(
        await service.verificarRecomendacaoRecursoMultaInfracaoFiscal(1),
      ).toBeNull();
    });
  });
    describe('verificarRecomendacaoEntregaObrigacoesAcessorias', () => {
    const NOME_SERVICO = 'Entrega de Obrigações Acessórias';

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
            id: 9,
            nome: NOME_SERVICO,
            descricao: 'Apoio na elaboração e entrega de obrigações',
          },
        },
      } as any);

      const resultado =
        await service.verificarRecomendacaoEntregaObrigacoesAcessorias(1);

      expect(resultado).toEqual({
        id: 9,
        nome: NOME_SERVICO,
        descricao: 'Apoio na elaboração e entrega de obrigações',
      });
    });

    it('deve retornar os dados somente no formato id, nome e descricao', async () => {
      mockEmpresaEObrigacoes();
      vi.spyOn(Obrigacao, 'findOne').mockResolvedValue({
        id: 100,
        obrigacaoServico: {
          servico: {
            id: 9,
            nome: NOME_SERVICO,
            descricao: 'Desc',
            valorBase: 500,
            ativo: true,
          },
        },
      } as any);

      const resultado =
        await service.verificarRecomendacaoEntregaObrigacoesAcessorias(1);

      expect(Object.keys(resultado!)).toEqual(['id', 'nome', 'descricao']);
    });

    it('deve consultar obrigações pendentes relacionadas ao serviço correto via OBRIGACAO_SERVICO', async () => {
      mockEmpresaEObrigacoes();
      const findOne = vi.spyOn(Obrigacao, 'findOne').mockResolvedValue(null);

      await service.verificarRecomendacaoEntregaObrigacoesAcessorias(1);

      expect(findOne).toHaveBeenCalledWith(
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
          ],
        }),
      );
    });

    it('deve retornar null quando não existir obrigação que atenda à condição', async () => {
      mockEmpresaEObrigacoes();
      vi.spyOn(Obrigacao, 'findOne').mockResolvedValue(null);

      const resultado =
        await service.verificarRecomendacaoEntregaObrigacoesAcessorias(1);

      expect(resultado).toBeNull();
    });

    it('não deve recomendar quando a obrigação não estiver pendente', async () => {
      mockEmpresaEObrigacoes();
      // O filtro status = pendente é aplicado no banco, que não retorna a obrigação paga
      const findOne = vi.spyOn(Obrigacao, 'findOne').mockResolvedValue(null);

      const resultado =
        await service.verificarRecomendacaoEntregaObrigacoesAcessorias(1);

      expect(findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: StatusObrigacao.PENDENTE }),
        }),
      );
      expect(resultado).toBeNull();
    });

    it('não deve recomendar quando a obrigação não estiver relacionada ao serviço', async () => {
      mockEmpresaEObrigacoes();
      // O filtro por nome do serviço é aplicado no banco (include com required: true)
      const findOne = vi.spyOn(Obrigacao, 'findOne').mockResolvedValue(null);

      const resultado =
        await service.verificarRecomendacaoEntregaObrigacoesAcessorias(1);

      expect(findOne).toHaveBeenCalledWith(
        expect.objectContaining({
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
      expect(resultado).toBeNull();
    });

    it('deve retornar null se o usuário não tiver empresa associada', async () => {
      vi.spyOn(Usuario, 'findByPk').mockResolvedValue({
        id: 1,
        empresas: [],
      } as any);

      expect(
        await service.verificarRecomendacaoEntregaObrigacoesAcessorias(1),
      ).toBeNull();
    });

    it('deve retornar null se a empresa não tiver obrigações cadastradas', async () => {
      vi.spyOn(Usuario, 'findByPk').mockResolvedValue({
        id: 1,
        empresas: [{ id: 10 }],
      } as any);
      vi.spyOn(ObrigacaoEmpresa, 'findAll').mockResolvedValue([]);

      expect(
        await service.verificarRecomendacaoEntregaObrigacoesAcessorias(1),
      ).toBeNull();
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

  describe('recomendarPlanejamentoTributario', () => {
    it('deve retornar null se o usuário não for encontrado', async () => {
      vi.spyOn(Usuario, 'findByPk').mockResolvedValue(null);

      const resultado = await service.recomendarPlanejamentoTributario(99);

      expect(resultado).toBeNull();
    });

    it('deve retornar null se o usuário não possuir empresa vinculada', async () => {
      vi.spyOn(Usuario, 'findByPk').mockResolvedValue({
        id: 1,
        empresas: [],
      } as any);

      const resultado = await service.recomendarPlanejamentoTributario(1);

      expect(resultado).toBeNull();
    });

    it('deve retornar null quando a empresa não possuir solicitações', async () => {
      vi.spyOn(Usuario, 'findByPk').mockResolvedValue({
        id: 1,
        empresas: [{ id: 10 }],
      } as any);

      solicitacaoModelMock.findAll.mockResolvedValue([]);

      const resultado = await service.recomendarPlanejamentoTributario(1);

      expect(resultado).toBeNull();
    });

    it('deve retornar null quando existir solicitação de apenas 1 serviço tributário diferente', async () => {
      vi.spyOn(Usuario, 'findByPk').mockResolvedValue({
        id: 1,
        empresas: [{ id: 10 }],
      } as any);

      solicitacaoModelMock.findAll.mockResolvedValue([
        { servicoId: 1 },
      ]);

      const resultado = await service.recomendarPlanejamentoTributario(1);

      expect(resultado).toBeNull();
    });

    it('não deve contar múltiplas solicitações do mesmo serviço como serviços diferentes', async () => {
      vi.spyOn(Usuario, 'findByPk').mockResolvedValue({
        id: 1,
        empresas: [{ id: 10 }],
      } as any);

      solicitacaoModelMock.findAll.mockResolvedValue([
        { servicoId: 1 },
        { servicoId: 1 },
      ]);

      const resultado = await service.recomendarPlanejamentoTributario(1);

      expect(resultado).toBeNull();
    });

    it('não deve considerar o próprio serviço 7 (Planejamento Tributário) na contagem', async () => {
      vi.spyOn(Usuario, 'findByPk').mockResolvedValue({
        id: 1,
        empresas: [{ id: 10 }],
      } as any);

      solicitacaoModelMock.findAll.mockResolvedValue([
        { servicoId: 1 },
        { servicoId: 7 },
      ]);

      const resultado = await service.recomendarPlanejamentoTributario(1);

      expect(resultado).toBeNull();
    });

    it('não deve considerar serviços fora da lista tributária definida (1 a 6)', async () => {
      vi.spyOn(Usuario, 'findByPk').mockResolvedValue({
        id: 1,
        empresas: [{ id: 10 }],
      } as any);

      solicitacaoModelMock.findAll.mockResolvedValue([
        { servicoId: 1 },
        { servicoId: 99 },
      ]);

      const resultado = await service.recomendarPlanejamentoTributario(1);

      expect(resultado).toBeNull();
    });

    it('deve recomendar Planejamento Tributário quando existirem solicitações de pelo menos 2 serviços tributários diferentes', async () => {
      vi.spyOn(Usuario, 'findByPk').mockResolvedValue({
        id: 1,
        empresas: [{ id: 10 }],
      } as any);

      solicitacaoModelMock.findAll.mockResolvedValue([
        { servicoId: 1 },
        { servicoId: 6 },
      ]);

      const resultado = await service.recomendarPlanejamentoTributario(1);

      expect(resultado).toEqual({
        id: 7,
        nome: 'Planejamento Tributário',
        descricao: 'Análise para otimização da carga tributária',
      });
      expect(Object.keys(resultado!)).toEqual(['id', 'nome', 'descricao']);
    });
  });

  describe('regularizacaoCadastral', () => {
    it('deve retornar null se o usuário não for encontrado', async () => {
      vi.spyOn(Usuario, 'findByPk').mockResolvedValue(null as any);

      const resultado = await service.regularizacaoCadastral(999);
      expect(resultado).toBeNull();
    });

    it('deve recomendar Regularização Cadastral quando cpf_cnpj do usuário for null', async () => {
      vi.spyOn(Usuario, 'findByPk').mockResolvedValue({
        id: 1,
        cpf_cnpj: null,
        celular: '15999999999',
        empresas: [],
      } as any);

      const resultado = await service.regularizacaoCadastral(1);
      expect(resultado).toEqual({
        id: 8,
        nome: 'Regularização Cadastral',
        descricao: 'Correção/regularização de dados cadastrais',
      });
    });

    it('deve recomendar Regularização Cadastral quando celular do usuário for vazio', async () => {
      vi.spyOn(Usuario, 'findByPk').mockResolvedValue({
        id: 1,
        cpf_cnpj: '12345678900',
        celular: '   ',
        empresas: [],
      } as any);

      const resultado = await service.regularizacaoCadastral(1);
      expect(resultado).toEqual({
        id: 8,
        nome: 'Regularização Cadastral',
        descricao: 'Correção/regularização de dados cadastrais',
      });
    });

    it('deve recomendar Regularização Cadastral quando nome_fantasia da empresa for null', async () => {
      vi.spyOn(Usuario, 'findByPk').mockResolvedValue({
        id: 1,
        cpf_cnpj: '12345678900',
        celular: '15999999999',
        empresas: [
          {
            id: 10,
            nome_fantasia: null,
            inscricao_estadual: '123456',
            inscricao_municipal: '789012',
            data_abertura: new Date('2020-01-10'),
          },
        ],
      } as any);

      const resultado = await service.regularizacaoCadastral(1);
      expect(resultado).toEqual({
        id: 8,
        nome: 'Regularização Cadastral',
        descricao: 'Correção/regularização de dados cadastrais',
      });
    });

    it('deve recomendar Regularização Cadastral quando inscricao_estadual da empresa for vazia', async () => {
      vi.spyOn(Usuario, 'findByPk').mockResolvedValue({
        id: 1,
        cpf_cnpj: '12345678900',
        celular: '15999999999',
        empresas: [
          {
            id: 10,
            nome_fantasia: 'Empresa Teste',
            inscricao_estadual: '',
            inscricao_municipal: '789012',
            data_abertura: new Date('2020-01-10'),
          },
        ],
      } as any);

      const resultado = await service.regularizacaoCadastral(1);
      expect(resultado).toEqual({
        id: 8,
        nome: 'Regularização Cadastral',
        descricao: 'Correção/regularização de dados cadastrais',
      });
    });

    it('deve recomendar Regularização Cadastral quando inscricao_municipal da empresa for null', async () => {
      vi.spyOn(Usuario, 'findByPk').mockResolvedValue({
        id: 1,
        cpf_cnpj: '12345678900',
        celular: '15999999999',
        empresas: [
          {
            id: 10,
            nome_fantasia: 'Empresa Teste',
            inscricao_estadual: '123456',
            inscricao_municipal: null,
            data_abertura: new Date('2020-01-10'),
          },
        ],
      } as any);

      const resultado = await service.regularizacaoCadastral(1);
      expect(resultado).toEqual({
        id: 8,
        nome: 'Regularização Cadastral',
        descricao: 'Correção/regularização de dados cadastrais',
      });
    });

    it('deve recomendar Regularização Cadastral quando data_abertura da empresa for null', async () => {
      vi.spyOn(Usuario, 'findByPk').mockResolvedValue({
        id: 1,
        cpf_cnpj: '12345678900',
        celular: '15999999999',
        empresas: [
          {
            id: 10,
            nome_fantasia: 'Empresa Teste',
            inscricao_estadual: '123456',
            inscricao_municipal: '789012',
            data_abertura: null,
          },
        ],
      } as any);

      const resultado = await service.regularizacaoCadastral(1);
      expect(resultado).toEqual({
        id: 8,
        nome: 'Regularização Cadastral',
        descricao: 'Correção/regularização de dados cadastrais',
      });
    });

    it('deve retornar null quando todos os dados do usuário e da empresa estiverem preenchidos', async () => {
      vi.spyOn(Usuario, 'findByPk').mockResolvedValue({
        id: 1,
        cpf_cnpj: '12345678900',
        celular: '15999999999',
        empresas: [
          {
            id: 10,
            nome_fantasia: 'Empresa Exemplo LTDA',
            inscricao_estadual: '123456',
            inscricao_municipal: '789012',
            data_abertura: new Date('2020-01-10'),
          },
        ],
      } as any);

      const resultado = await service.regularizacaoCadastral(1);
      expect(resultado).toBeNull();
    });

    it('deve retornar null quando usuário não tem empresa mas seus dados cadastrais estão preenchidos', async () => {
      vi.spyOn(Usuario, 'findByPk').mockResolvedValue({
        id: 1,
        cpf_cnpj: '12345678900',
        celular: '15999999999',
        empresas: [],
      } as any);

      const resultado = await service.regularizacaoCadastral(1);
      expect(resultado).toBeNull();
    });
  });

  describe('consultoriaContabil', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('deve recomendar Consultoria Contábil quando existirem solicitações de pelo menos 3 serviços diferentes', async () => {
      vi.spyOn(Usuario, 'findByPk').mockResolvedValue({
        id: 1,
        empresas: [{ id: 10 }],
      } as any);

      solicitacaoModelMock.findAll.mockResolvedValue([
        { servicoId: 1 },
        { servicoId: 2 },
        { servicoId: 6 },
      ]);

      const resultado = await service.consultoriaContabil(1);

      expect(resultado).toEqual({
        id: 9,
        nome: 'Consultoria Contábil',
        descricao: 'Atendimento para análise de questões contábeis',
      });
    });

    it('deve retornar os dados estritamente no formato id, nome e descricao', async () => {
      vi.spyOn(Usuario, 'findByPk').mockResolvedValue({
        id: 1,
        empresas: [{ id: 10 }],
      } as any);

      solicitacaoModelMock.findAll.mockResolvedValue([
        { servicoId: 1 },
        { servicoId: 2 },
        { servicoId: 3 },
      ]);

      const resultado = await service.consultoriaContabil(1);

      expect(Object.keys(resultado!)).toEqual(['id', 'nome', 'descricao']);
    });

    it('deve retornar null quando existirem solicitações de apenas 2 serviços diferentes', async () => {
      vi.spyOn(Usuario, 'findByPk').mockResolvedValue({
        id: 1,
        empresas: [{ id: 10 }],
      } as any);

      solicitacaoModelMock.findAll.mockResolvedValue([
        { servicoId: 1 },
        { servicoId: 2 },
      ]);

      const resultado = await service.consultoriaContabil(1);

      expect(resultado).toBeNull();
    });

    it('deve contar múltiplas solicitações do mesmo serviço como apenas um serviço', async () => {
      vi.spyOn(Usuario, 'findByPk').mockResolvedValue({
        id: 1,
        empresas: [{ id: 10 }],
      } as any);

      solicitacaoModelMock.findAll.mockResolvedValue([
        { servicoId: 1 },
        { servicoId: 1 },
        { servicoId: 2 },
        { servicoId: 6 },
      ]);

      const resultado = await service.consultoriaContabil(1);

      expect(resultado).toEqual({
        id: 9,
        nome: 'Consultoria Contábil',
        descricao: 'Atendimento para análise de questões contábeis',
      });
    });

    it('não deve considerar o serviço 9 na contagem dos serviços diferentes', async () => {
      vi.spyOn(Usuario, 'findByPk').mockResolvedValue({
        id: 1,
        empresas: [{ id: 10 }],
      } as any);

      solicitacaoModelMock.findAll.mockResolvedValue([
        { servicoId: 1 },
        { servicoId: 2 },
        { servicoId: 9 },
      ]);

      const resultado = await service.consultoriaContabil(1);

      expect(resultado).toBeNull();
    });

    it('deve retornar null quando a empresa já possuir uma solicitação do serviço 9 mesmo tendo 3 outros serviços', async () => {
      vi.spyOn(Usuario, 'findByPk').mockResolvedValue({
        id: 1,
        empresas: [{ id: 10 }],
      } as any);

      solicitacaoModelMock.findAll.mockResolvedValue([
        { servicoId: 1 },
        { servicoId: 2 },
        { servicoId: 6 },
        { servicoId: 9 },
      ]);

      const resultado = await service.consultoriaContabil(1);

      expect(resultado).toBeNull();
    });

    it('não deve recomendar quando o serviço 9 for a única solicitação além de outros 2 serviços', async () => {
      vi.spyOn(Usuario, 'findByPk').mockResolvedValue({
        id: 1,
        empresas: [{ id: 10 }],
      } as any);

      solicitacaoModelMock.findAll.mockResolvedValue([
        { servicoId: 3 },
        { servicoId: 4 },
        { servicoId: 9 },
      ]);

      const resultado = await service.consultoriaContabil(1);

      expect(resultado).toBeNull();
    });

    it('deve identificar corretamente as solicitações através do empresaId', async () => {
      vi.spyOn(Usuario, 'findByPk').mockResolvedValue({
        id: 1,
        empresas: [{ id: 15 }],
      } as any);

      solicitacaoModelMock.findAll.mockResolvedValue([]);

      await service.consultoriaContabil(1);

      expect(solicitacaoModelMock.findAll).toHaveBeenCalledWith({
        where: {
          empresaId: 15,
        },
      });
    });

    it('deve identificar corretamente os serviços através do servicoId da solicitação', async () => {
      vi.spyOn(Usuario, 'findByPk').mockResolvedValue({
        id: 1,
        empresas: [{ id: 10 }],
      } as any);

      solicitacaoModelMock.findAll.mockResolvedValue([
        { servicoId: 10 },
        { servicoId: 11 },
        { servicoId: 12 },
      ]);

      const resultado = await service.consultoriaContabil(1);

      expect(resultado).not.toBeNull();
      expect(resultado?.id).toBe(9);
    });

    it('deve retornar null quando não houver empresa vinculada ao usuário', async () => {
      vi.spyOn(Usuario, 'findByPk').mockResolvedValue({
        id: 1,
        empresas: [],
      } as any);

      const resultado = await service.consultoriaContabil(1);

      expect(resultado).toBeNull();
    });

    it('deve retornar null quando a empresa não possuir solicitações suficientes', async () => {
      vi.spyOn(Usuario, 'findByPk').mockResolvedValue({
        id: 1,
        empresas: [{ id: 10 }],
      } as any);

      solicitacaoModelMock.findAll.mockResolvedValue([]);

      const resultado = await service.consultoriaContabil(1);

      expect(resultado).toBeNull();
    });

    it('não deve utilizar datas para determinar a condição da recomendação', async () => {
      vi.spyOn(Usuario, 'findByPk').mockResolvedValue({
        id: 1,
        empresas: [{ id: 10 }],
      } as any);

      solicitacaoModelMock.findAll.mockResolvedValue([
        { servicoId: 1, data_solicitacao: new Date('2026-01-01') },
        { servicoId: 2, data_conclusao: new Date('2026-02-01') },
        { servicoId: 3 },
      ]);

      const resultado = await service.consultoriaContabil(1);

      expect(solicitacaoModelMock.findAll).toHaveBeenCalledWith({
        where: {
          empresaId: 10,
        },
      });
      expect(resultado).not.toBeNull();
      expect(resultado?.id).toBe(9);
    });
  });

  
  describe('obterRecomendacao', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('deve retornar todas as recomendações encontradas', async () => {
      const recomendacao1 = {
        id: 8,
        nome: 'Regularização Cadastral',
        descricao: 'Correção/regularização de dados cadastrais',
      };

      const recomendacao2 = {
        id: 9,
        nome: 'Consultoria Contábil',
        descricao: 'Atendimento para análise de questões contábeis',
      };

      vi.spyOn(
        service,
        'verificarRecomendacaoRegularizacaoObrigacoesFiscais',
      ).mockResolvedValue(null);
      vi.spyOn(
        service,
        'verificarRecomendacaoRegularizacaoDebitosFiscais',
      ).mockResolvedValue(null);
      vi.spyOn(
        service,
        'verificarRecomendacaoParcelamentoDebitosFiscais',
      ).mockResolvedValue(null);
      vi.spyOn(
        service,
        'verificarRecomendacaoRecursoMultaInfracaoFiscal',
      ).mockResolvedValue(null);
      vi.spyOn(
        service,
        'verificarRecomendacaoEntregaObrigacoesAcessorias',
      ).mockResolvedValue(null);
      vi.spyOn(service, 'recomendarRevisaoRegime').mockResolvedValue(null);
      vi.spyOn(service, 'recomendarPlanejamentoTributario').mockResolvedValue(
        null,
      );
      vi.spyOn(service, 'regularizacaoCadastral').mockResolvedValue(
        recomendacao1,
      );
      vi.spyOn(service, 'consultoriaContabil').mockResolvedValue(
        recomendacao2,
      );
      vi.spyOn(service, 'buscarServicosPopulares').mockResolvedValue([]);

      const resultado = await service.obterRecomendacao(1);

      expect(resultado).toEqual([recomendacao1, recomendacao2]);
      expect(service.buscarServicosPopulares).not.toHaveBeenCalled();
    });

    it('deve retornar uma recomendação quando somente uma for encontrada', async () => {
      const recomendacao = {
        id: 9,
        nome: 'Consultoria Contábil',
        descricao: 'Atendimento para análise de questões contábeis',
      };

      vi.spyOn(
        service,
        'verificarRecomendacaoRegularizacaoObrigacoesFiscais',
      ).mockResolvedValue(null);
      vi.spyOn(
        service,
        'verificarRecomendacaoRegularizacaoDebitosFiscais',
      ).mockResolvedValue(null);
      vi.spyOn(
        service,
        'verificarRecomendacaoParcelamentoDebitosFiscais',
      ).mockResolvedValue(null);
      vi.spyOn(
        service,
        'verificarRecomendacaoRecursoMultaInfracaoFiscal',
      ).mockResolvedValue(null);
      vi.spyOn(
        service,
        'verificarRecomendacaoEntregaObrigacoesAcessorias',
      ).mockResolvedValue(null);
      vi.spyOn(service, 'recomendarRevisaoRegime').mockResolvedValue(null);
      vi.spyOn(service, 'recomendarPlanejamentoTributario').mockResolvedValue(
        null,
      );
      vi.spyOn(service, 'regularizacaoCadastral').mockResolvedValue(null);
      vi.spyOn(service, 'consultoriaContabil').mockResolvedValue(recomendacao);
      vi.spyOn(service, 'buscarServicosPopulares').mockResolvedValue([]);

      const resultado = await service.obterRecomendacao(1);

      expect(resultado).toEqual([recomendacao]);
      expect(service.buscarServicosPopulares).not.toHaveBeenCalled();
    });

    it('deve retornar os serviços populares quando nenhuma recomendação for encontrada', async () => {
      const populares = [
        {
          id: 2,
          nome: 'Serviço Popular',
          descricao: 'Serviço mais solicitado',
        },
      ];

      vi.spyOn(
        service,
        'verificarRecomendacaoRegularizacaoObrigacoesFiscais',
      ).mockResolvedValue(null);
      vi.spyOn(
        service,
        'verificarRecomendacaoRegularizacaoDebitosFiscais',
      ).mockResolvedValue(null);
      vi.spyOn(
        service,
        'verificarRecomendacaoParcelamentoDebitosFiscais',
      ).mockResolvedValue(null);
      vi.spyOn(
        service,
        'verificarRecomendacaoRecursoMultaInfracaoFiscal',
      ).mockResolvedValue(null);
      vi.spyOn(
        service,
        'verificarRecomendacaoEntregaObrigacoesAcessorias',
      ).mockResolvedValue(null);
      vi.spyOn(service, 'recomendarRevisaoRegime').mockResolvedValue(null);
      vi.spyOn(service, 'recomendarPlanejamentoTributario').mockResolvedValue(
        null,
      );
      vi.spyOn(service, 'regularizacaoCadastral').mockResolvedValue(null);
      vi.spyOn(service, 'consultoriaContabil').mockResolvedValue(null);
      vi.spyOn(service, 'buscarServicosPopulares').mockResolvedValue(populares);

      const resultado = await service.obterRecomendacao(1);

      expect(resultado).toEqual(populares);
      expect(service.buscarServicosPopulares).toHaveBeenCalledOnce();
    });

    it('deve retornar array vazio quando não houver recomendações nem serviços populares', async () => {
      vi.spyOn(
        service,
        'verificarRecomendacaoRegularizacaoObrigacoesFiscais',
      ).mockResolvedValue(null);
      vi.spyOn(
        service,
        'verificarRecomendacaoRegularizacaoDebitosFiscais',
      ).mockResolvedValue(null);
      vi.spyOn(
        service,
        'verificarRecomendacaoParcelamentoDebitosFiscais',
      ).mockResolvedValue(null);
      vi.spyOn(
        service,
        'verificarRecomendacaoRecursoMultaInfracaoFiscal',
      ).mockResolvedValue(null);
      vi.spyOn(
        service,
        'verificarRecomendacaoEntregaObrigacoesAcessorias',
      ).mockResolvedValue(null);
      vi.spyOn(service, 'recomendarRevisaoRegime').mockResolvedValue(null);
      vi.spyOn(service, 'recomendarPlanejamentoTributario').mockResolvedValue(
        null,
      );
      vi.spyOn(service, 'regularizacaoCadastral').mockResolvedValue(null);
      vi.spyOn(service, 'consultoriaContabil').mockResolvedValue(null);
      vi.spyOn(service, 'buscarServicosPopulares').mockResolvedValue([]);

      const resultado = await service.obterRecomendacao(1);

      expect(resultado).toEqual([]);
    });
  });

});
