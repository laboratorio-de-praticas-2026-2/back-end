import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';

import {
  Solicitacao,
  StatusSolicitacao,
} from '../../models/solicitacao.model.js';

import {
  Obrigacao,
  NaturezaCobranca,
  StatusObrigacao,
  TipoObrigacao,
} from '../../models/obrigacao.model.js';

import { ObrigacaoEmpresa } from '../../models/obrigacao-empresa.model.js';

import { ObrigacaoServico } from '../../models/obrigacao-servico.model.js';

import { Pagamento } from '../../models/pagamento.model.js';

import {
  Parcela,
  StatusParcela,
} from '../../models/parcela.model.js';

import { Empresa } from '../../models/empresa.model.js';

import { Servico } from '../../models/servico.model.js';

import { Usuario } from '../../models/usuario.model.js';

import {
  getHojeSP,
  resolvePeriodo,
  round2,
} from '../../commons/utils/period.util.js';

export interface DebitoEmAberto {
  clienteId: number;
  clienteNome: string;
  regimes: string[];
  servicosExtras: string[];
  valorEmAberto: number;
}

@Injectable()
export class GeralService {
  private readonly logger = new Logger(GeralService.name);

  constructor(
    @InjectModel(Solicitacao)
    private readonly solicitacaoModel: typeof Solicitacao,

    @InjectModel(Obrigacao)
    private readonly obrigacaoModel: typeof Obrigacao,

    @InjectModel(ObrigacaoEmpresa)
    private readonly obrigacaoEmpresaModel: typeof ObrigacaoEmpresa,

    @InjectModel(ObrigacaoServico)
    private readonly obrigacaoServicoModel: typeof ObrigacaoServico,

    @InjectModel(Pagamento)
    private readonly pagamentoModel: typeof Pagamento,

    @InjectModel(Parcela)
    private readonly parcelaModel: typeof Parcela,

    @InjectModel(Empresa)
    private readonly empresaModel: typeof Empresa,

    @InjectModel(Servico)
    private readonly servicoModel: typeof Servico,

    @InjectModel(Usuario)
    private readonly usuarioModel: typeof Usuario,
  ) {}

  async getIndicadores(startDate?: string, endDate?: string) {
    const periodo = resolvePeriodo(startDate, endDate);

    const hoje = getHojeSP();
    const hojeMaisSeteDias = new Date(hoje);
    hojeMaisSeteDias.setUTCDate(hojeMaisSeteDias.getUTCDate() + 7);

    const dataHoje = hoje.toISOString().slice(0, 10);
    const dataSeteDias = hojeMaisSeteDias.toISOString().slice(0, 10);

    const dataInicioPeriodo = periodo.start.toISOString().slice(0, 10);
    const dataFimPeriodoExclusivo = periodo.endExclusive
      .toISOString()
      .slice(0, 10);

    const [
      processosEmAndamento,
      processosConcluidos,
      novosProcessos,
      obrigacoesVencendo,
      faturamentoPeriodo,
      clientesInadimplentes,
      taxaRetencao,
      debitosEmAberto,
    ] = await Promise.all([
      this.solicitacaoModel.count({
        where: {
          dataSolicitacao: {
            [Op.gte]: periodo.start,
            [Op.lt]: periodo.endExclusive,
          },
          status: {
            [Op.in]: [
              StatusSolicitacao.RECEBIDO,
              StatusSolicitacao.AGUARDANDO_PAGAMENTO,
              StatusSolicitacao.AGUARDANDO_DOCUMENTO,
              StatusSolicitacao.EM_ANDAMENTO,
            ],
          },
        },
      }),

      this.solicitacaoModel.count({
        where: {
          dataSolicitacao: {
            [Op.gte]: periodo.start,
            [Op.lt]: periodo.endExclusive,
          },
          status: StatusSolicitacao.CONCLUIDO,
        },
      }),

      this.solicitacaoModel.count({
        where: {
          dataSolicitacao: {
            [Op.gte]: periodo.start,
            [Op.lt]: periodo.endExclusive,
          },
        },
      }),

      this.obrigacaoModel.count({
        where: {
          naturezaCobranca: NaturezaCobranca.TRIBUTO,
          status: StatusObrigacao.PENDENTE,
          vencimento: {
            [Op.gte]: dataHoje,
            [Op.lte]: dataSeteDias,
          },
        },
      }),

      this.calcularFaturamentoPeriodo(
        dataInicioPeriodo,
        dataFimPeriodoExclusivo,
      ),

      this.calcularClientesInadimplentes(dataHoje),

      this.calcularTaxaRetencao(periodo.start, periodo.endExclusive),

      this.calcularDebitosEmAberto(),
    ]);

    return {
      cards: {
        processosEmAndamento,
        processosConcluidos,
        obrigacoesVencendo,
        novosProcessos,
        taxaRetencao,
        faturamentoPeriodo,
        clientesInadimplentes,
      },
      debitosEmAberto,
    };
  }

  private async calcularFaturamentoPeriodo(
    dataInicio: string,
    dataFimExclusiva: string,
  ): Promise<number> {
    const parcelasPagas = await this.parcelaModel.findAll({
      attributes: ['id', 'idPagamento', 'valor'],
      where: {
        status: StatusParcela.PAGO,
        dataPagamento: {
          [Op.gte]: dataInicio,
          [Op.lt]: dataFimExclusiva,
        },
      },
    });

    if (parcelasPagas.length === 0) {
      return 0;
    }

    const pagamentoIds = [
      ...new Set(parcelasPagas.map((parcela) => parcela.idPagamento)),
    ];

    const pagamentos = await this.pagamentoModel.findAll({
      attributes: ['id', 'idObrigacao'],
      where: {
        id: {
          [Op.in]: pagamentoIds,
        },
      },
    });

    if (pagamentos.length === 0) {
      return 0;
    }

    const obrigacaoIds = [
      ...new Set(pagamentos.map((pagamento) => pagamento.idObrigacao)),
    ];

    const obrigacoes = await this.obrigacaoModel.findAll({
      attributes: ['id', 'naturezaCobranca'],
      where: {
        id: {
          [Op.in]: obrigacaoIds,
        },
        naturezaCobranca: {
          [Op.in]: [
            NaturezaCobranca.MENSALIDADE,
            NaturezaCobranca.SERVICO_AVULSO,
          ],
        },
      },
    });

    if (obrigacoes.length === 0) {
      return 0;
    }

    const obrigacoesElegiveis = new Set(
      obrigacoes.map((obrigacao) => obrigacao.id),
    );

    const pagamentosElegiveis = new Set(
      pagamentos
        .filter((pagamento) => obrigacoesElegiveis.has(pagamento.idObrigacao))
        .map((pagamento) => pagamento.id),
    );

    const total = parcelasPagas.reduce((soma, parcela) => {
      if (!pagamentosElegiveis.has(parcela.idPagamento)) {
        return soma;
      }

      return soma + Number(parcela.valor);
    }, 0);

    return round2(total);
  }

  private async calcularClientesInadimplentes(
    dataHoje: string,
  ): Promise<number> {
    const parcelas = await this.parcelaModel.findAll({
      attributes: ['id', 'idPagamento'],
      where: {
        status: {
          [Op.in]: [StatusParcela.ATIVO, StatusParcela.ATRASADO],
        },
        vencimento: {
          [Op.lt]: dataHoje,
        },
      },
    });

    if (parcelas.length === 0) {
      return 0;
    }

    const pagamentoIds = [
      ...new Set(parcelas.map((parcela) => parcela.idPagamento)),
    ];

    const pagamentos = await this.pagamentoModel.findAll({
      attributes: ['id', 'idObrigacao'],
      where: {
        id: {
          [Op.in]: pagamentoIds,
        },
      },
    });

    if (pagamentos.length === 0) {
      return 0;
    }

    const obrigacaoIds = [
      ...new Set(pagamentos.map((pagamento) => pagamento.idObrigacao)),
    ];

    const obrigacoes = await this.obrigacaoModel.findAll({
      attributes: ['id', 'tipo', 'naturezaCobranca'],
      where: {
        id: {
          [Op.in]: obrigacaoIds,
        },
        naturezaCobranca: {
          [Op.in]: [
            NaturezaCobranca.MENSALIDADE,
            NaturezaCobranca.SERVICO_AVULSO,
          ],
        },
      },
    });

    if (obrigacoes.length === 0) {
      return 0;
    }

    const obrigacoesElegiveis = new Set(
      obrigacoes.map((obrigacao) => obrigacao.id),
    );

    const obrigacaoIdsComParcelasElegiveis = new Set(
      pagamentos
        .filter((pagamento) => obrigacoesElegiveis.has(pagamento.idObrigacao))
        .map((pagamento) => pagamento.idObrigacao),
    );

    const obrigacoesEmpresa = obrigacoes.filter(
      (obrigacao) =>
        obrigacao.tipo === TipoObrigacao.EMPRESA &&
        obrigacaoIdsComParcelasElegiveis.has(obrigacao.id),
    );

    const obrigacoesServico = obrigacoes.filter(
      (obrigacao) =>
        obrigacao.tipo === TipoObrigacao.SERVICO &&
        obrigacaoIdsComParcelasElegiveis.has(obrigacao.id),
    );

    const usuarioIds = new Set<number>();

    if (obrigacoesEmpresa.length > 0) {
      const obrigacaoEmpresaRows =
        await this.obrigacaoEmpresaModel.findAll({
          attributes: ['idObrigacao', 'idEmpresa'],
          where: {
            idObrigacao: {
              [Op.in]: obrigacoesEmpresa.map((obrigacao) => obrigacao.id),
            },
          },
        });

      if (obrigacaoEmpresaRows.length > 0) {
        const empresaIds = [
          ...new Set(
            obrigacaoEmpresaRows.map(
              (obrigacaoEmpresa) => obrigacaoEmpresa.idEmpresa,
            ),
          ),
        ];

        const empresas = await this.empresaModel.findAll({
          attributes: ['id', 'usuarioId'],
          where: {
            id: {
              [Op.in]: empresaIds,
            },
          },
        });

        const usuarioPorEmpresa = new Map(
          empresas.map((empresa) => [empresa.id, empresa.usuarioId]),
        );

        const obrigacaoComVinculoEmpresa = new Set<number>();

        for (const obrigacaoEmpresa of obrigacaoEmpresaRows) {
          const usuarioId = usuarioPorEmpresa.get(
            obrigacaoEmpresa.idEmpresa,
          );

          if (usuarioId === undefined) {
            this.logger.warn(
              `Obrigação ${obrigacaoEmpresa.idObrigacao} possui vínculo com empresa ${obrigacaoEmpresa.idEmpresa}, mas a empresa não foi encontrada.`,
            );
            continue;
          }

          usuarioIds.add(usuarioId);
          obrigacaoComVinculoEmpresa.add(obrigacaoEmpresa.idObrigacao);
        }

        for (const obrigacao of obrigacoesEmpresa) {
          if (!obrigacaoComVinculoEmpresa.has(obrigacao.id)) {
            this.logger.warn(
              `Obrigação ${obrigacao.id} do tipo empresa sem vínculo em ObrigacaoEmpresa.`,
            );
          }
        }
      } else {
        for (const obrigacao of obrigacoesEmpresa) {
          this.logger.warn(
            `Obrigação ${obrigacao.id} do tipo empresa sem vínculo em ObrigacaoEmpresa.`,
          );
        }
      }
    }

    if (obrigacoesServico.length > 0) {
      const obrigacaoServicoRows =
        await this.obrigacaoServicoModel.findAll({
          attributes: ['idObrigacao', 'solicitacaoId'],
          where: {
            idObrigacao: {
              [Op.in]: obrigacoesServico.map((obrigacao) => obrigacao.id),
            },
          },
        });

      const solicitacaoIds = [
        ...new Set(
          obrigacaoServicoRows.map(
            (obrigacaoServico) => obrigacaoServico.solicitacaoId,
          ),
        ),
      ];

      if (solicitacaoIds.length > 0) {
        const solicitacoes = await this.solicitacaoModel.findAll({
          attributes: ['id', 'usuarioId'],
          where: {
            id: {
              [Op.in]: solicitacaoIds,
            },
          },
          paranoid: false,
        });

        const usuarioPorSolicitacao = new Map(
          solicitacoes.map((solicitacao) => [
            solicitacao.id,
            solicitacao.usuarioId,
          ]),
        );

        const obrigacaoComVinculoServico = new Set<number>();

        for (const obrigacaoServico of obrigacaoServicoRows) {
          const usuarioId = usuarioPorSolicitacao.get(
            obrigacaoServico.solicitacaoId,
          );

          if (usuarioId === undefined) {
            this.logger.warn(
              `Obrigação ${obrigacaoServico.idObrigacao} possui vínculo com solicitação ${obrigacaoServico.solicitacaoId}, mas a solicitação não foi encontrada.`,
            );
            continue;
          }

          usuarioIds.add(usuarioId);
          obrigacaoComVinculoServico.add(obrigacaoServico.idObrigacao);
        }

        for (const obrigacao of obrigacoesServico) {
          if (!obrigacaoComVinculoServico.has(obrigacao.id)) {
            this.logger.warn(
              `Obrigação ${obrigacao.id} do tipo serviço sem vínculo em ObrigacaoServico.`,
            );
          }
        }
      } else {
        for (const obrigacao of obrigacoesServico) {
          this.logger.warn(
            `Obrigação ${obrigacao.id} do tipo serviço sem vínculo em ObrigacaoServico.`,
          );
        }
      }
    }

    return usuarioIds.size;
  }

  private async calcularTaxaRetencao(
    inicioAtual: Date,
    fimAtualExclusivo: Date,
  ): Promise<number | null> {
    const duracaoPeriodoDias = Math.round(
      (fimAtualExclusivo.getTime() - inicioAtual.getTime()) /
        (24 * 60 * 60 * 1000),
    );

    const inicioAnterior = new Date(inicioAtual);
    inicioAnterior.setUTCDate(
      inicioAnterior.getUTCDate() - duracaoPeriodoDias,
    );

    const fimAnteriorExclusivo = new Date(inicioAtual);

    const [solicitacoesAtual, solicitacoesAnterior] = await Promise.all([
      this.solicitacaoModel.findAll({
        attributes: ['usuarioId'],
        where: {
          dataSolicitacao: {
            [Op.gte]: inicioAtual,
            [Op.lt]: fimAtualExclusivo,
          },
          status: {
            [Op.ne]: StatusSolicitacao.CANCELADO,
          },
        },
      }),

      this.solicitacaoModel.findAll({
        attributes: ['usuarioId'],
        where: {
          dataSolicitacao: {
            [Op.gte]: inicioAnterior,
            [Op.lt]: fimAnteriorExclusivo,
          },
          status: {
            [Op.ne]: StatusSolicitacao.CANCELADO,
          },
        },
      }),
    ]);

    const clientesAtual = new Set(
      solicitacoesAtual.map((solicitacao) => solicitacao.usuarioId),
    );

    const clientesAnterior = new Set(
      solicitacoesAnterior.map((solicitacao) => solicitacao.usuarioId),
    );

    if (clientesAnterior.size === 0) {
      return null;
    }

    let clientesRecorrentes = 0;

    for (const usuarioId of clientesAtual) {
      if (clientesAnterior.has(usuarioId)) {
        clientesRecorrentes++;
      }
    }

    return round2(
      (clientesRecorrentes / clientesAnterior.size) * 100,
    );
  }

  private async calcularDebitosEmAberto(): Promise<DebitoEmAberto[]> {
    const parcelas = await this.parcelaModel.findAll({
      attributes: ['id', 'idPagamento', 'valor'],
      where: {
        status: {
          [Op.in]: [StatusParcela.ATIVO, StatusParcela.ATRASADO],
        },
      },
    });

    if (parcelas.length === 0) {
      return [];
    }

    const pagamentoIds = [
      ...new Set(parcelas.map((parcela) => parcela.idPagamento)),
    ];

    const pagamentos = await this.pagamentoModel.findAll({
      attributes: ['id', 'idObrigacao'],
      where: {
        id: {
          [Op.in]: pagamentoIds,
        },
      },
    });

    if (pagamentos.length === 0) {
      return [];
    }

    const pagamentoPorId = new Map(
      pagamentos.map((pagamento) => [pagamento.id, pagamento]),
    );

    const obrigacaoIds = [
      ...new Set(pagamentos.map((pagamento) => pagamento.idObrigacao)),
    ];

    const obrigacoes = await this.obrigacaoModel.findAll({
      attributes: ['id', 'tipo', 'naturezaCobranca'],
      where: {
        id: {
          [Op.in]: obrigacaoIds,
        },
        naturezaCobranca: {
          [Op.in]: [
            NaturezaCobranca.MENSALIDADE,
            NaturezaCobranca.SERVICO_AVULSO,
          ],
        },
      },
    });

    if (obrigacoes.length === 0) {
      return [];
    }

    const obrigacaoPorId = new Map(
      obrigacoes.map((obrigacao) => [obrigacao.id, obrigacao]),
    );

    const obrigacoesEmpresa = obrigacoes.filter(
      (obrigacao) => obrigacao.tipo === TipoObrigacao.EMPRESA,
    );

    const obrigacoesServico = obrigacoes.filter(
      (obrigacao) => obrigacao.tipo === TipoObrigacao.SERVICO,
    );

    const usuarioPorObrigacao = new Map<number, number>();
    const regimesPorUsuario = new Map<number, Set<string>>();
    const servicosExtrasPorUsuario = new Map<number, Set<string>>();

    const empresaIds = new Set<number>();
    const empresaPorId = new Map<number, Empresa>();

    const obrigacaoEmpresaRows =
      obrigacoesEmpresa.length > 0
        ? await this.obrigacaoEmpresaModel.findAll({
            attributes: ['idObrigacao', 'idEmpresa'],
            where: {
              idObrigacao: {
                [Op.in]: obrigacoesEmpresa.map(
                  (obrigacao) => obrigacao.id,
                ),
              },
            },
          })
        : [];

    const obrigacaoEmpresaPorObrigacao = new Map(
      obrigacaoEmpresaRows.map((row) => [row.idObrigacao, row]),
    );

    for (const obrigacao of obrigacoesEmpresa) {
      const vinculo = obrigacaoEmpresaPorObrigacao.get(obrigacao.id);

      if (!vinculo) {
        this.logger.warn(
          `Obrigação ${obrigacao.id} do tipo empresa sem vínculo em ObrigacaoEmpresa.`,
        );
        continue;
      }

      empresaIds.add(vinculo.idEmpresa);
    }

    const obrigacaoServicoRows =
      obrigacoesServico.length > 0
        ? await this.obrigacaoServicoModel.findAll({
            attributes: ['idObrigacao', 'idServico', 'solicitacaoId'],
            where: {
              idObrigacao: {
                [Op.in]: obrigacoesServico.map(
                  (obrigacao) => obrigacao.id,
                ),
              },
            },
          })
        : [];

    const obrigacaoServicoPorObrigacao = new Map(
      obrigacaoServicoRows.map((row) => [row.idObrigacao, row]),
    );

    const solicitacaoIds = [
      ...new Set(
        obrigacaoServicoRows.map((row) => row.solicitacaoId),
      ),
    ];

    const solicitacoes = solicitacaoIds.length
      ? await this.solicitacaoModel.findAll({
          attributes: ['id', 'usuarioId', 'empresaId'],
          where: {
            id: {
              [Op.in]: solicitacaoIds,
            },
          },
          paranoid: false,
        })
      : [];

    const solicitacaoPorId = new Map(
      solicitacoes.map((solicitacao) => [solicitacao.id, solicitacao]),
    );

    for (const solicitacao of solicitacoes) {
      if (solicitacao.empresaId !== null) {
        empresaIds.add(solicitacao.empresaId);
      }
    }

    const empresas = empresaIds.size
      ? await this.empresaModel.findAll({
          attributes: ['id', 'usuarioId', 'regimeTributario'],
          where: {
            id: {
              [Op.in]: [...empresaIds],
            },
          },
        })
      : [];

    for (const empresa of empresas) {
      empresaPorId.set(empresa.id, empresa);
    }

    const servicoIds = [
      ...new Set(
        obrigacaoServicoRows.map((row) => row.idServico),
      ),
    ];

    const servicos = servicoIds.length
      ? await this.servicoModel.findAll({
          attributes: ['id', 'nome'],
          where: {
            id: {
              [Op.in]: servicoIds,
            },
          },
          paranoid: false,
        })
      : [];

    const servicoPorId = new Map(
      servicos.map((servico) => [servico.id, servico]),
    );

    for (const obrigacao of obrigacoesEmpresa) {
      const vinculo = obrigacaoEmpresaPorObrigacao.get(obrigacao.id);

      if (!vinculo) {
        continue;
      }

      const empresa = empresaPorId.get(vinculo.idEmpresa);

      if (!empresa) {
        this.logger.warn(
          `Obrigação ${obrigacao.id} possui vínculo com empresa ${vinculo.idEmpresa}, mas a empresa não foi encontrada.`,
        );
        continue;
      }

      usuarioPorObrigacao.set(obrigacao.id, empresa.usuarioId);

      if (!regimesPorUsuario.has(empresa.usuarioId)) {
        regimesPorUsuario.set(
          empresa.usuarioId,
          new Set<string>(),
        );
      }

      regimesPorUsuario
        .get(empresa.usuarioId)!
        .add(empresa.regimeTributario);
    }

    for (const obrigacao of obrigacoesServico) {
      const vinculo = obrigacaoServicoPorObrigacao.get(obrigacao.id);

      if (!vinculo) {
        this.logger.warn(
          `Obrigação ${obrigacao.id} do tipo serviço sem vínculo em ObrigacaoServico.`,
        );
        continue;
      }

      const solicitacao = solicitacaoPorId.get(vinculo.solicitacaoId);

      if (!solicitacao) {
        this.logger.warn(
          `Obrigação ${obrigacao.id} possui vínculo com solicitação ${vinculo.solicitacaoId}, mas a solicitação não foi encontrada.`,
        );
        continue;
      }

      usuarioPorObrigacao.set(obrigacao.id, solicitacao.usuarioId);

      if (solicitacao.empresaId !== null) {
        const empresa = empresaPorId.get(solicitacao.empresaId);

        if (!empresa) {
          this.logger.warn(
            `Solicitação ${solicitacao.id} possui empresa ${solicitacao.empresaId}, mas a empresa não foi encontrada.`,
          );
        } else {
          if (!regimesPorUsuario.has(solicitacao.usuarioId)) {
            regimesPorUsuario.set(
              solicitacao.usuarioId,
              new Set<string>(),
            );
          }

          regimesPorUsuario
            .get(solicitacao.usuarioId)!
            .add(empresa.regimeTributario);
        }
      }

      if (obrigacao.naturezaCobranca === NaturezaCobranca.SERVICO_AVULSO) {
        const servico = servicoPorId.get(vinculo.idServico);

        if (!servico) {
          this.logger.warn(
            `Obrigação ${obrigacao.id} possui serviço ${vinculo.idServico}, mas o serviço não foi encontrado.`,
          );
        } else {
          if (!servicosExtrasPorUsuario.has(solicitacao.usuarioId)) {
            servicosExtrasPorUsuario.set(
              solicitacao.usuarioId,
              new Set<string>(),
            );
          }

          servicosExtrasPorUsuario
            .get(solicitacao.usuarioId)!
            .add(servico.nome);
        }
      }
    }

    const saldoCentavosPorUsuario = new Map<number, number>();

    for (const parcela of parcelas) {
      const pagamento = pagamentoPorId.get(parcela.idPagamento);

      if (!pagamento) {
        continue;
      }

      const obrigacao = obrigacaoPorId.get(pagamento.idObrigacao);

      if (!obrigacao) {
        continue;
      }

      const usuarioId = usuarioPorObrigacao.get(obrigacao.id);

      if (usuarioId === undefined) {
        continue;
      }

      const valorCentavos = Math.round(Number(parcela.valor) * 100);

      const saldoAtual =
        saldoCentavosPorUsuario.get(usuarioId) ?? 0;

      saldoCentavosPorUsuario.set(
        usuarioId,
        saldoAtual + valorCentavos,
      );
    }

    const usuarioIds = [...saldoCentavosPorUsuario.entries()]
      .filter(([, saldoCentavos]) => saldoCentavos > 0)
      .map(([usuarioId]) => usuarioId);

    if (usuarioIds.length === 0) {
      return [];
    }

    const usuarios = await this.usuarioModel.findAll({
      attributes: ['id', 'nome'],
      where: {
        id: {
          [Op.in]: usuarioIds,
        },
      },
    });

    const usuarioPorId = new Map(
      usuarios.map((usuario) => [usuario.id, usuario]),
    );

    const debitos: DebitoEmAberto[] = [];

    for (const usuarioId of usuarioIds) {
      const usuario = usuarioPorId.get(usuarioId);

      if (!usuario) {
        this.logger.warn(
          `Cliente ${usuarioId} não foi encontrado para consolidar os débitos em aberto.`,
        );
        continue;
      }

      const saldoCentavos =
        saldoCentavosPorUsuario.get(usuarioId) ?? 0;

      const regimes = [
        ...(regimesPorUsuario.get(usuarioId) ?? new Set<string>()),
      ].sort();

      const servicosExtras = [
        ...(servicosExtrasPorUsuario.get(usuarioId) ??
          new Set<string>()),
      ].sort();

      debitos.push({
        clienteId: usuarioId,
        clienteNome: usuario.nome,
        regimes,
        servicosExtras,
        valorEmAberto: round2(saldoCentavos / 100),
      });
    }

    return debitos
      .filter((debito) => debito.valorEmAberto > 0)
      .sort((a, b) => {
        if (b.valorEmAberto !== a.valorEmAberto) {
          return b.valorEmAberto - a.valorEmAberto;
        }

        return a.clienteId - b.clienteId;
      });
  }
}