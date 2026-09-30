import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';

import {
  Obrigacao,
  NaturezaCobranca,
  TipoObrigacao,
} from '../../models/obrigacao.model.js';
import { Pagamento } from '../../models/pagamento.model.js';
import {
  Parcela,
  StatusParcela,
} from '../../models/parcela.model.js';
import { ObrigacaoEmpresa } from '../../models/obrigacao-empresa.model.js';
import { ObrigacaoServico } from '../../models/obrigacao-servico.model.js';
import { Empresa } from '../../models/empresa.model.js';
import {
  Solicitacao,
  StatusSolicitacao,
} from '../../models/solicitacao.model.js';
import { Usuario } from '../../models/usuario.model.js';
import {
  getHojeSP,
  resolvePeriodo,
} from '../../commons/utils/period.util.js';

@Injectable()
export class ClientesService {
  private readonly logger = new Logger(ClientesService.name);

  constructor(
    @InjectModel(Obrigacao)
    private readonly obrigacaoModel: typeof Obrigacao,
    @InjectModel(Pagamento)
    private readonly pagamentoModel: typeof Pagamento,
    @InjectModel(Parcela)
    private readonly parcelaModel: typeof Parcela,
    @InjectModel(ObrigacaoEmpresa)
    private readonly obrigacaoEmpresaModel: typeof ObrigacaoEmpresa,
    @InjectModel(ObrigacaoServico)
    private readonly obrigacaoServicoModel: typeof ObrigacaoServico,
    @InjectModel(Empresa)
    private readonly empresaModel: typeof Empresa,
    @InjectModel(Solicitacao)
    private readonly solicitacaoModel: typeof Solicitacao,
    @InjectModel(Usuario)
    private readonly usuarioModel: typeof Usuario,
  ) {}

  async getDashboardClientes(startDate?: string, endDate?: string) {
    const periodo = resolvePeriodo(startDate, endDate);
    const inicio = periodo.start.toISOString().slice(0, 10);
    const fim = periodo.endExclusive.toISOString().slice(0, 10);
    const hoje = getHojeSP().toISOString().slice(0, 10);

    // Datas com horário: meia-noite de São Paulo convertida em instante.
    const inicioSolicitacoes = this.inicioDiaSP(inicio);
    const fimSolicitacoes = this.inicioDiaSP(fim);

    const [solicitacoesPeriodo, obrigacoes] = await Promise.all([
      this.solicitacaoModel.findAll({
        attributes: ['id', 'usuarioId'],
        where: {
          deletedAt: null,
          status: { [Op.ne]: StatusSolicitacao.CANCELADO },
          dataSolicitacao: {
            [Op.gte]: inicioSolicitacoes,
            [Op.lt]: fimSolicitacoes,
          },
        },
      }),
      this.obrigacaoModel.findAll({
        attributes: ['id', 'tipo'],
        where: {
          deletedAt: null,
          naturezaCobranca: {
            [Op.in]: [
              NaturezaCobranca.MENSALIDADE,
              NaturezaCobranca.SERVICO_AVULSO,
            ],
          },
        },
      }),
    ]);

    const pagamentos = obrigacoes.length
      ? await this.pagamentoModel.findAll({
          attributes: ['id', 'idObrigacao'],
          where: {
            deletedAt: null,
            idObrigacao: {
              [Op.in]: obrigacoes.map((item) => item.id),
            },
          },
        })
      : [];

    const parcelas = pagamentos.length
      ? await this.parcelaModel.findAll({
          attributes: ['id', 'idPagamento', 'valor', 'status'],
          where: {
            deletedAt: null,
            idPagamento: {
              [Op.in]: pagamentos.map((item) => item.id),
            },
            [Op.or]: [
              {
                status: StatusParcela.PAGO,
                dataPagamento: {
                  [Op.gte]: inicio,
                  [Op.lt]: fim,
                },
              },
              {
                status: {
                  [Op.in]: [
                    StatusParcela.ATIVO,
                    StatusParcela.ATRASADO,
                  ],
                },
                vencimento: { [Op.lt]: hoje },
              },
            ],
          },
        })
      : [];

    const pagamentoPorId = new Map(
      pagamentos.map((item) => [item.id, item]),
    );

    const idsObrigacoes = new Set<number>();

    for (const parcela of parcelas) {
      const pagamento = pagamentoPorId.get(parcela.idPagamento);

      if (pagamento) {
        idsObrigacoes.add(pagamento.idObrigacao);
      }
    }

    const obrigacoesElegiveis = obrigacoes.filter((item) =>
      idsObrigacoes.has(item.id),
    );

    const idsEmpresa = obrigacoesElegiveis
      .filter((item) => item.tipo === TipoObrigacao.EMPRESA)
      .map((item) => item.id);

    const idsServico = obrigacoesElegiveis
      .filter((item) => item.tipo === TipoObrigacao.SERVICO)
      .map((item) => item.id);

    const [vinculosEmpresa, vinculosServico] = await Promise.all([
      idsEmpresa.length
        ? this.obrigacaoEmpresaModel.findAll({
            where: { idObrigacao: { [Op.in]: idsEmpresa } },
          })
        : Promise.resolve([]),
      idsServico.length
        ? this.obrigacaoServicoModel.findAll({
            where: { idObrigacao: { [Op.in]: idsServico } },
          })
        : Promise.resolve([]),
    ]);

    // Cadastros excluídos logicamente não apagam operações preservadas.
    const [empresas, solicitacoesVinculadas] = await Promise.all([
      vinculosEmpresa.length
        ? this.empresaModel.findAll({
            attributes: ['id', 'usuarioId'],
            where: {
              id: {
                [Op.in]: vinculosEmpresa.map((item) => item.idEmpresa),
              },
            },
            paranoid: false,
          })
        : Promise.resolve([]),
      vinculosServico.length
        ? this.solicitacaoModel.findAll({
            attributes: ['id', 'usuarioId'],
            where: {
              id: {
                [Op.in]: vinculosServico.map(
                  (item) => item.solicitacaoId,
                ),
              },
            },
            paranoid: false,
          })
        : Promise.resolve([]),
    ]);

    const usuarioPorEmpresa = new Map(
      empresas.map((item) => [item.id, item.usuarioId]),
    );
    const usuarioPorSolicitacao = new Map(
      solicitacoesVinculadas.map((item) => [item.id, item.usuarioId]),
    );
    const clientePorObrigacao = new Map<number, number>();

    for (const vinculo of vinculosEmpresa) {
      const usuarioId = usuarioPorEmpresa.get(vinculo.idEmpresa);

      if (usuarioId !== undefined) {
        clientePorObrigacao.set(vinculo.idObrigacao, usuarioId);
      }
    }

    for (const vinculo of vinculosServico) {
      const usuarioId = usuarioPorSolicitacao.get(
        vinculo.solicitacaoId,
      );

      if (usuarioId !== undefined) {
        clientePorObrigacao.set(vinculo.idObrigacao, usuarioId);
      }
    }

    const idsUsuarios = [
      ...new Set([
        ...clientePorObrigacao.values(),
        ...solicitacoesPeriodo.map((item) => item.usuarioId),
      ]),
    ];

    const usuarios = idsUsuarios.length
      ? await this.usuarioModel.findAll({
          attributes: ['id', 'nome'],
          where: { id: { [Op.in]: idsUsuarios } },
          paranoid: false,
        })
      : [];

    const nomePorUsuario = new Map(
      usuarios.map((item) => [item.id, item.nome]),
    );

    const quantidadePorCliente = new Map<number, number>();
    const receitaPorCliente = new Map<number, bigint>();
    const atrasoPorCliente = new Map<number, bigint>();
    const vinculosAusentes = new Set<number>();

    for (const solicitacao of solicitacoesPeriodo) {
      const id = solicitacao.usuarioId;
      if (!nomePorUsuario.has(id)) continue;

      quantidadePorCliente.set(
        id,
        (quantidadePorCliente.get(id) ?? 0) + 1,
      );
    }

    for (const parcela of parcelas) {
      const pagamento = pagamentoPorId.get(parcela.idPagamento);
      if (!pagamento) continue;

      const clienteId = clientePorObrigacao.get(
        pagamento.idObrigacao,
      );

      if (
        clienteId === undefined ||
        !nomePorUsuario.has(clienteId)
      ) {
        vinculosAusentes.add(pagamento.idObrigacao);
        continue;
      }

      const valor = this.centavos(parcela.valor);

      const destino =
        parcela.status === StatusParcela.PAGO
          ? receitaPorCliente
          : atrasoPorCliente;

      destino.set(
        clienteId,
        (destino.get(clienteId) ?? 0n) + valor,
      );
    }

    for (const id of vinculosAusentes) {
      this.logger.warn(
        `Obrigação ${id} sem vínculo válido de cliente; ` +
          'excluída dos rankings financeiros.',
      );
    }

    const ordenarValores = (
      valores: Map<number, bigint>,
    ): Array<[number, bigint]> =>
      [...valores].sort(([idA, valorA], [idB, valorB]) => {
        if (valorA === valorB) return idA - idB;
        return valorA > valorB ? -1 : 1;
      });

    return {
      topClientesServicos: [...quantidadePorCliente]
        .sort(
          ([idA, quantidadeA], [idB, quantidadeB]) =>
            quantidadeB - quantidadeA || idA - idB,
        )
        .map(([clienteId, quantidadeServicos]) => ({
          clienteId,
          clienteNome: nomePorUsuario.get(clienteId)!,
          quantidadeServicos,
        })),

      topClientesRentaveis: ordenarValores(receitaPorCliente).map(
        ([clienteId, valor]) => ({
          clienteId,
          clienteNome: nomePorUsuario.get(clienteId)!,
          totalFaturado: Number(valor) / 100,
        }),
      ),

      clientesInadimplentes: ordenarValores(atrasoPorCliente).map(
        ([clienteId, valor]) => ({
          clienteId,
          clienteNome: nomePorUsuario.get(clienteId)!,
          valorEmAtraso: Number(valor) / 100,
        }),
      ),
    };
  }

  private centavos(valor: string | number): bigint {
    const partes = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(
      String(valor),
    );

    if (!partes) {
      throw new Error('Valor monetário inválido retornado pelo banco.');
    }

    const inteiro = BigInt(partes[2]) * 100n;
    const decimal = BigInt((partes[3] ?? '').padEnd(2, '0'));

    return (partes[1] ? -1n : 1n) * (inteiro + decimal);
  }

  private inicioDiaSP(data: string): Date {
    const referencia = new Date(`${data}T12:00:00Z`);

    const partes = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo',
      timeZoneName: 'longOffset',
    }).formatToParts(referencia);

    const offset = partes
      .find((parte) => parte.type === 'timeZoneName')!
      .value.replace('GMT', '') || '+00:00';

    return new Date(`${data}T00:00:00${offset}`);
  }
}