import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { BadRequestException } from '@nestjs/common';
import { vi } from 'vitest';
import { Op } from 'sequelize';

import { GeralService } from './geral.service.js';
import { Solicitacao } from '../../models/solicitacao.model.js';
import { Obrigacao } from '../../models/obrigacao.model.js';
import { ObrigacaoEmpresa } from '../../models/obrigacao-empresa.model.js';
import { ObrigacaoServico } from '../../models/obrigacao-servico.model.js';
import { Pagamento } from '../../models/pagamento.model.js';
import { Parcela } from '../../models/parcela.model.js';
import { Empresa } from '../../models/empresa.model.js';
import { Servico } from '../../models/servico.model.js';
import { Usuario } from '../../models/usuario.model.js';
import { getHojeSP } from '../../commons/utils/period.util.js';

describe('GeralService', () => {
  let service: GeralService;

  let solicitacaoCountMock: ReturnType<typeof vi.fn>;
  let solicitacaoFindAllMock: ReturnType<typeof vi.fn>;

  let obrigacaoCountMock: ReturnType<typeof vi.fn>;
  let obrigacaoFindAllMock: ReturnType<typeof vi.fn>;

  let obrigacaoEmpresaFindAllMock: ReturnType<typeof vi.fn>;
  let obrigacaoServicoFindAllMock: ReturnType<typeof vi.fn>;

  let pagamentoFindAllMock: ReturnType<typeof vi.fn>;
  let parcelaFindAllMock: ReturnType<typeof vi.fn>;

  let empresaFindAllMock: ReturnType<typeof vi.fn>;
  let servicoFindAllMock: ReturnType<typeof vi.fn>;
  let usuarioFindAllMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    solicitacaoCountMock = vi.fn().mockImplementation((options: any) => {
      const status = options?.where?.status;

      if (status) {
        if (typeof status === 'string') {
          if (status === 'concluido') {
            return Promise.resolve(2);
          }
        }

        if (typeof status === 'object') {
          const valoresStatus: string[] = [];

          for (const symbol of Object.getOwnPropertySymbols(status)) {
            const valor = status[symbol as keyof typeof status];

            if (Array.isArray(valor)) {
              valoresStatus.push(...valor);
            } else if (typeof valor === 'string') {
              valoresStatus.push(valor);
            }
          }

          const statusEmAndamento = [
            'recebido',
            'aguardando_pagamento',
            'aguardando_documento',
            'em_andamento',
          ];

          const contemTodosOsStatus = statusEmAndamento.every((item) =>
            valoresStatus.includes(item),
          );

          if (contemTodosOsStatus) {
            return Promise.resolve(4);
          }
        }
      }

      // Quando não existe filtro de status, a contagem representa
      // todos os processos criados no período, inclusive cancelados.
      return Promise.resolve(6);
    });

    solicitacaoFindAllMock = vi.fn().mockImplementation((options: any) => {
      const ids = options?.where?.id?.[Op.in];
      const dataSolicitacao = options?.where?.dataSolicitacao;

      // Consulta usada pelo caminho:
      // ObrigacaoServico -> Solicitacao -> Usuario.
      if (Array.isArray(ids)) {
        if (ids.includes(20)) {
          return Promise.resolve([
            {
              id: 20,
              usuarioId: 202,
              empresaId: 11,
            },
          ]);
        }

        return Promise.resolve([]);
      }

      // Consultas da taxa de retenção.
      if (dataSolicitacao?.[Op.gte]) {
        const inicio = dataSolicitacao[Op.gte];

        const normalizarData = (valor: unknown): string => {
          if (valor instanceof Date) {
            return valor.toISOString().slice(0, 10);
          }

          if (typeof valor === 'string') {
            return valor.slice(0, 10);
          }

          return '';
        };

        const inicioTexto = normalizarData(inicio);

        // Período atual: 2026-09-01 até 2026-09-15.
        // Clientes: 101 e 102.
        if (inicioTexto === '2026-09-01') {
          return Promise.resolve([
            {
              usuarioId: 101,
            },
            {
              usuarioId: 102,
            },
          ]);
        }

        // Período anterior equivalente: 2026-08-17 até 2026-09-01.
        // Clientes: 101 e 103.
        if (inicioTexto === '2026-08-17') {
          return Promise.resolve([
            {
              usuarioId: 101,
            },
            {
              usuarioId: 103,
            },
          ]);
        }

        return Promise.resolve([]);
      }

      return Promise.resolve([]);
    });

    obrigacaoCountMock = vi.fn().mockResolvedValue(3);

    const parcelasPagas = [
      {
        id: 1,
        idPagamento: 1,
        valor: 100,
        status: 'pago',
        dataPagamento: '2026-09-05',
      },
      {
        id: 2,
        idPagamento: 2,
        valor: 200,
        status: 'pago',
        dataPagamento: '2026-09-10',
      },
      {
        id: 3,
        idPagamento: 3,
        valor: 50,
        status: 'pago',
        dataPagamento: '2026-09-15',
      },
      {
        id: 4,
        idPagamento: 4,
        valor: 999,
        status: 'pago',
        dataPagamento: '2026-09-08',
      },
    ];

    const parcelasInadimplentes = [
      {
        id: 5,
        idPagamento: 1,
        valor: 300,
        status: 'atrasado',
        vencimento: '2026-09-20',
      },
      {
        id: 6,
        idPagamento: 2,
        valor: 400,
        status: 'ativo',
        vencimento: '2026-09-21',
      },
      {
        id: 7,
        idPagamento: 1,
        valor: 250,
        status: 'ativo',
        vencimento: '2026-10-05',
      },
      {
        id: 8,
        idPagamento: 2,
        valor: 100,
        status: 'ativo',
        vencimento: '2026-10-10',
      },
      {
        id: 9,
        idPagamento: 4,
        valor: 999,
        status: 'ativo',
        vencimento: '2026-10-01',
      },
    ];

    parcelaFindAllMock = vi.fn().mockImplementation((options: any) => {
      const status = options?.where?.status;

      // O faturamento busca somente parcelas pagas.
      if (status === 'pago') {
        return Promise.resolve(parcelasPagas);
      }

      // Inadimplência e débitos em aberto buscam parcelas ativas
      // ou atrasadas.
      const statusInadimplencia = status?.[Op.in];

      if (
        Array.isArray(statusInadimplencia) &&
        statusInadimplencia.includes('ativo') &&
        statusInadimplencia.includes('atrasado')
      ) {
        return Promise.resolve(parcelasInadimplentes);
      }

      return Promise.resolve([]);
    });

    pagamentoFindAllMock = vi.fn().mockResolvedValue([
      {
        id: 1,
        idObrigacao: 1,
        valorTotal: 5000,
      },
      {
        id: 2,
        idObrigacao: 2,
        valorTotal: 8000,
      },
      {
        id: 3,
        idObrigacao: 3,
        valorTotal: 12000,
      },
      {
        id: 4,
        idObrigacao: 4,
        valorTotal: 99999,
      },
    ]);

    const todasObrigacoes = [
      {
        id: 1,
        tipo: 'empresa',
        naturezaCobranca: 'mensalidade',
        valor: 5000,
      },
      {
        id: 2,
        tipo: 'servico',
        naturezaCobranca: 'servico_avulso',
        valor: 8000,
      },
      {
        id: 3,
        tipo: 'empresa',
        naturezaCobranca: 'mensalidade',
        valor: 12000,
      },
      {
        id: 4,
        tipo: 'empresa',
        naturezaCobranca: 'tributo',
        valor: 99999,
      },
    ];

    obrigacaoFindAllMock = vi.fn().mockImplementation((options: any) => {
      const filtroNatureza = options?.where?.naturezaCobranca;

      // Simula o comportamento do Sequelize quando o serviço pede:
      // naturezaCobranca IN ('mensalidade', 'servico_avulso').
      if (filtroNatureza?.[Op.in]) {
        const naturezasPermitidas = filtroNatureza[Op.in];

        return Promise.resolve(
          todasObrigacoes.filter((obrigacao) =>
            naturezasPermitidas.includes(obrigacao.naturezaCobranca),
          ),
        );
      }

      return Promise.resolve(todasObrigacoes);
    });

    obrigacaoEmpresaFindAllMock = vi
      .fn()
      .mockImplementation((options: any) => {
        const ids = options?.where?.idObrigacao?.[Op.in];

        if (Array.isArray(ids) && ids.includes(1)) {
          return Promise.resolve([
            {
              idObrigacao: 1,
              idEmpresa: 10,
            },
          ]);
        }

        return Promise.resolve([]);
      });

    obrigacaoServicoFindAllMock = vi
      .fn()
      .mockImplementation((options: any) => {
        const ids = options?.where?.idObrigacao?.[Op.in];

        if (Array.isArray(ids) && ids.includes(2)) {
          return Promise.resolve([
            {
              idObrigacao: 2,
              idServico: 50,
              solicitacaoId: 20,
            },
          ]);
        }

        return Promise.resolve([]);
      });

    empresaFindAllMock = vi.fn().mockImplementation((options: any) => {
      const ids = options?.where?.id?.[Op.in];

      if (Array.isArray(ids)) {
        const empresas = [];

        if (ids.includes(10)) {
          empresas.push({
            id: 10,
            usuarioId: 101,
            regimeTributario: 'simples_nacional',
          });
        }

        if (ids.includes(11)) {
          empresas.push({
            id: 11,
            usuarioId: 202,
            regimeTributario: 'mei',
          });
        }

        return Promise.resolve(empresas);
      }

      return Promise.resolve([]);
    });

    servicoFindAllMock = vi.fn().mockImplementation((options: any) => {
      const ids = options?.where?.id?.[Op.in];

      if (Array.isArray(ids) && ids.includes(50)) {
        return Promise.resolve([
          {
            id: 50,
            nome: 'Certificado Digital',
          },
        ]);
      }

      return Promise.resolve([]);
    });

    usuarioFindAllMock = vi.fn().mockImplementation((options: any) => {
      const ids = options?.where?.id?.[Op.in];

      if (Array.isArray(ids)) {
        return Promise.resolve(
          [
            {
              id: 101,
              nome: 'Cliente Empresa',
            },
            {
              id: 202,
              nome: 'Cliente Serviço',
            },
          ].filter((usuario) => ids.includes(usuario.id)),
        );
      }

      return Promise.resolve([]);
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeralService,
        {
          provide: getModelToken(Solicitacao),
          useValue: {
            count: solicitacaoCountMock,
            findAll: solicitacaoFindAllMock,
          },
        },
        {
          provide: getModelToken(Obrigacao),
          useValue: {
            count: obrigacaoCountMock,
            findAll: obrigacaoFindAllMock,
          },
        },
        {
          provide: getModelToken(ObrigacaoEmpresa),
          useValue: {
            findAll: obrigacaoEmpresaFindAllMock,
          },
        },
        {
          provide: getModelToken(ObrigacaoServico),
          useValue: {
            findAll: obrigacaoServicoFindAllMock,
          },
        },
        {
          provide: getModelToken(Pagamento),
          useValue: {
            findAll: pagamentoFindAllMock,
          },
        },
        {
          provide: getModelToken(Parcela),
          useValue: {
            findAll: parcelaFindAllMock,
          },
        },
        {
          provide: getModelToken(Empresa),
          useValue: {
            findAll: empresaFindAllMock,
          },
        },
        {
          provide: getModelToken(Servico),
          useValue: {
            findAll: servicoFindAllMock,
          },
        },
        {
          provide: getModelToken(Usuario),
          useValue: {
            findAll: usuarioFindAllMock,
          },
        },
      ],
    }).compile();

    service = module.get<GeralService>(GeralService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('deve aceitar um período válido', async () => {
    await expect(
      service.getIndicadores('2026-09-01', '2026-09-15'),
    ).resolves.toBeDefined();
  });

  it('deve aceitar o período sem filtros de data', async () => {
    await expect(service.getIndicadores()).resolves.toBeDefined();
  });

  it('deve rejeitar quando apenas startDate for informado', async () => {
    await expect(
      service.getIndicadores('2026-09-01'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('deve rejeitar quando apenas endDate for informado', async () => {
    await expect(
      service.getIndicadores(undefined, '2026-09-15'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('deve rejeitar uma data com formato inválido', async () => {
    await expect(
      service.getIndicadores('2026-09-01', '2026-9-15'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('deve rejeitar uma data de calendário inválida', async () => {
    await expect(
      service.getIndicadores('2026-02-30', '2026-03-10'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('deve rejeitar quando startDate for posterior a endDate', async () => {
    await expect(
      service.getIndicadores('2026-09-20', '2026-09-10'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('deve contar somente processos em andamento', async () => {
    const resultado = await service.getIndicadores(
      '2026-09-01',
      '2026-09-15',
    );

    expect(resultado.cards.processosEmAndamento).toBe(4);
  });

  it('deve contar somente processos concluídos', async () => {
    const resultado = await service.getIndicadores(
      '2026-09-01',
      '2026-09-15',
    );

    expect(resultado.cards.processosConcluidos).toBe(2);
  });

  it('deve contar novos processos independentemente do status atual', async () => {
    const resultado = await service.getIndicadores(
      '2026-09-01',
      '2026-09-15',
    );

    expect(resultado.cards.novosProcessos).toBe(6);
  });

  it('deve contar obrigações tributárias pendentes vencendo hoje até os próximos 7 dias', async () => {
    const resultado = await service.getIndicadores(
      '2026-09-01',
      '2026-09-15',
    );

    expect(resultado.cards.obrigacoesVencendo).toBe(3);

    expect(obrigacaoCountMock).toHaveBeenCalledTimes(1);

    const [opcoes] = obrigacaoCountMock.mock.calls[0];

    expect(opcoes.where.naturezaCobranca).toBe('tributo');
    expect(opcoes.where.status).toBe('pendente');

    const hoje = getHojeSP();

    const limite = new Date(hoje);
    limite.setUTCDate(limite.getUTCDate() + 7);

    const vencimento = opcoes.where.vencimento;

    const normalizarData = (valor: unknown): string => {
      if (valor instanceof Date) {
        return valor.toISOString().slice(0, 10);
      }

      if (typeof valor === 'string') {
        return valor.slice(0, 10);
      }

      throw new Error(`Valor de data inesperado: ${String(valor)}`);
    };

    const between = vencimento?.[Op.between];

    if (Array.isArray(between)) {
      expect(between).toHaveLength(2);

      expect(normalizarData(between[0])).toBe(
        hoje.toISOString().slice(0, 10),
      );

      expect(normalizarData(between[1])).toBe(
        limite.toISOString().slice(0, 10),
      );

      return;
    }

    const dataInicial = vencimento?.[Op.gte];
    const dataFinal = vencimento?.[Op.lte];

    expect(dataInicial).toBeDefined();
    expect(dataFinal).toBeDefined();

    expect(normalizarData(dataInicial)).toBe(
      hoje.toISOString().slice(0, 10),
    );

    expect(normalizarData(dataFinal)).toBe(
      limite.toISOString().slice(0, 10),
    );
  });

  it('deve calcular o faturamento usando somente parcelas pagas elegíveis no período', async () => {
    const resultado = await service.getIndicadores(
      '2026-09-01',
      '2026-09-15',
    );

    // 100 + 200 + 50 = 350.
    // A parcela de tributo (999) deve ser excluída.
    // Os valoresTotal dos pagamentos não entram no cálculo.
    expect(resultado.cards.faturamentoPeriodo).toBe(350);

    expect(parcelaFindAllMock).toHaveBeenCalled();

    const [opcoesParcela] =
      parcelaFindAllMock.mock.calls.find(
        ([options]) => options?.where?.status === 'pago',
      ) ?? [];

    expect(opcoesParcela).toBeDefined();
    expect(opcoesParcela.where.status).toBe('pago');

    const dataPagamento = opcoesParcela.where.dataPagamento;

    const normalizarData = (valor: unknown): string => {
      if (valor instanceof Date) {
        return valor.toISOString().slice(0, 10);
      }

      if (typeof valor === 'string') {
        return valor.slice(0, 10);
      }

      throw new Error(`Valor de data inesperado: ${String(valor)}`);
    };

    const dataInicial = dataPagamento?.[Op.gte];
    const dataFinal = dataPagamento?.[Op.lt];

    expect(dataInicial).toBeDefined();
    expect(dataFinal).toBeDefined();

    expect(normalizarData(dataInicial)).toBe('2026-09-01');
    expect(normalizarData(dataFinal)).toBe('2026-09-16');

    expect(pagamentoFindAllMock).toHaveBeenCalled();
    expect(obrigacaoFindAllMock).toHaveBeenCalled();
  });

  it('deve contar clientes inadimplentes por obrigações de empresa e de serviço', async () => {
    const resultado = await service.getIndicadores(
      '2026-09-01',
      '2026-09-15',
    );

    // Cliente 101:
    // Parcela atrasada -> Pagamento 1 -> Obrigação 1 -> Empresa 10 -> Usuario 101
    //
    // Cliente 202:
    // Parcela ativa -> Pagamento 2 -> Obrigação 2 -> Solicitacao 20 -> Usuario 202
    //
    // Os dois possuem parcela com vencimento anterior a hoje.
    expect(resultado.cards.clientesInadimplentes).toBe(2);

    const chamadasParcela = parcelaFindAllMock.mock.calls;

    const chamadaInadimplencia = chamadasParcela.find(
      ([options]) => {
        const status = options?.where?.status;

        return (
          status?.[Op.in]?.includes('ativo') &&
          status?.[Op.in]?.includes('atrasado')
        );
      },
    );

    expect(chamadaInadimplencia).toBeDefined();

    const vencimento = chamadaInadimplencia?.[0]?.where?.vencimento;

    expect(vencimento?.[Op.lt]).toBeDefined();
  });

  it('deve calcular a taxa de retenção entre períodos equivalentes', async () => {
    const resultado = await service.getIndicadores(
      '2026-09-01',
      '2026-09-15',
    );

    // Período atual:
    // clientes 101 e 102
    //
    // Período anterior:
    // clientes 101 e 103
    //
    // Apenas o cliente 101 aparece nos dois períodos:
    // 1 / 2 * 100 = 50%.
    expect(resultado.cards.taxaRetencao).toBe(50);

    const chamadasRetencao =
      solicitacaoFindAllMock.mock.calls.filter(
        ([options]) => options?.where?.dataSolicitacao,
      );

    expect(chamadasRetencao).toHaveLength(2);

    for (const [options] of chamadasRetencao) {
      expect(options.where.status?.[Op.ne]).toBe('cancelado');
      expect(options.where.dataSolicitacao?.[Op.gte]).toBeDefined();
      expect(options.where.dataSolicitacao?.[Op.lt]).toBeDefined();
    }
  });

  it('deve retornar null quando não existem clientes no período anterior', async () => {
    solicitacaoFindAllMock.mockImplementation((options: any) => {
      const ids = options?.where?.id?.[Op.in];

      // Mantém o vínculo da obrigação de serviço.
      if (Array.isArray(ids)) {
        if (ids.includes(20)) {
          return Promise.resolve([
            {
              id: 20,
              usuarioId: 202,
              empresaId: 11,
            },
          ]);
        }

        return Promise.resolve([]);
      }

      const dataSolicitacao = options?.where?.dataSolicitacao;

      if (dataSolicitacao?.[Op.gte]) {
        const inicio = dataSolicitacao[Op.gte];

        const inicioTexto =
          inicio instanceof Date
            ? inicio.toISOString().slice(0, 10)
            : String(inicio).slice(0, 10);

        if (inicioTexto === '2026-09-01') {
          return Promise.resolve([
            {
              usuarioId: 101,
            },
          ]);
        }

        if (inicioTexto === '2026-08-17') {
          return Promise.resolve([]);
        }
      }

      return Promise.resolve([]);
    });

    const resultado = await service.getIndicadores(
      '2026-09-01',
      '2026-09-15',
    );

    expect(resultado.cards.taxaRetencao).toBeNull();
  });

  it('deve calcular débitos em aberto por cliente sem duplicar parcelas e ignorando tributos', async () => {
    const resultado = await service.getIndicadores(
      '2026-09-01',
      '2026-09-15',
    );

    expect(resultado.debitosEmAberto).toHaveLength(2);

    // Cliente 101:
    // R$ 300 + R$ 250 = R$ 550
    // Obrigação mensalidade vinculada à empresa 10.
    expect(resultado.debitosEmAberto[0]).toEqual({
      clienteId: 101,
      clienteNome: 'Cliente Empresa',
      regimes: ['simples_nacional'],
      servicosExtras: [],
      valorEmAberto: 550,
    });

    // Cliente 202:
    // R$ 400 + R$ 100 = R$ 500
    // Obrigação serviço avulso vinculada à solicitação 20.
    // A empresa da solicitação define o regime.
    expect(resultado.debitosEmAberto[1]).toEqual({
      clienteId: 202,
      clienteNome: 'Cliente Serviço',
      regimes: ['mei'],
      servicosExtras: ['Certificado Digital'],
      valorEmAberto: 500,
    });

    // O tributo de R$ 999 não aparece em nenhum cliente.
    const valores = resultado.debitosEmAberto.map(
      (debito) => debito.valorEmAberto,
    );

    expect(valores).toEqual([550, 500]);

    // A ordenação deve ser pelo maior valor em aberto.
    expect(
      resultado.debitosEmAberto[0].valorEmAberto,
    ).toBeGreaterThan(
      resultado.debitosEmAberto[1].valorEmAberto,
    );
  });
});
