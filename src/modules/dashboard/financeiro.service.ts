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
import { Solicitacao } from '../../models/solicitacao.model.js';
import { Usuario } from '../../models/usuario.model.js';
import {
  getHojeSP,
  resolvePeriodo,
} from '../../commons/utils/period.util.js';

@Injectable()
export class FinanceiroService {
  private readonly logger = new Logger(FinanceiroService.name);

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

  async getDashboardFinanceiro(startDate?: string, endDate?: string) {
    const periodo = resolvePeriodo(startDate, endDate);
    const inicio = periodo.start.toISOString().slice(0, 10);
    const fim = periodo.endExclusive.toISOString().slice(0, 10);

    const hoje = getHojeSP();
    const dataHoje = hoje.toISOString().slice(0, 10);

    const limitePrevisao = new Date(hoje);
    limitePrevisao.setUTCDate(limitePrevisao.getUTCDate() + 30);
    const dataLimite = limitePrevisao.toISOString().slice(0, 10);

    const obrigacoes = await this.obrigacaoModel.findAll({
      where: {
        deletedAt: null,
        naturezaCobranca: {
          [Op.in]: [
            NaturezaCobranca.MENSALIDADE,
            NaturezaCobranca.SERVICO_AVULSO,
          ],
        },
      },
    });

    const pagamentos = obrigacoes.length
      ? await this.pagamentoModel.findAll({
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
                [Op.or]: [
                  {
                    vencimento: {
                      [Op.gte]: inicio,
                      [Op.lt]: fim,
                    },
                  },
                  {
                    vencimento: { [Op.lt]: dataLimite },
                  },
                ],
              },
            ],
          },
        })
      : [];

    const obrigacaoPorId = new Map(
      obrigacoes.map((item) => [item.id, item]),
    );
    const pagamentoPorId = new Map(
      pagamentos.map((item) => [item.id, item]),
    );

    const obrigacoesRecebidas = new Set<number>();

    for (const parcela of parcelas) {
      if (parcela.status !== StatusParcela.PAGO) continue;

      const pagamento = pagamentoPorId.get(parcela.idPagamento);
      if (pagamento) {
        obrigacoesRecebidas.add(pagamento.idObrigacao);
      }
    }

    const clientePorObrigacao = await this.buscarClientes(
      obrigacoes.filter((item) => obrigacoesRecebidas.has(item.id)),
    );

    const historico = new Map<string, bigint>();
    const cursor = new Date(periodo.start);
    cursor.setUTCDate(1);

    while (cursor < periodo.endExclusive) {
      historico.set(cursor.toISOString().slice(0, 7), 0n);
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }

    let recebido = 0n;
    let aReceber = 0n;
    let extras = 0n;
    let receitaClientes = 0n;
    let mensalidades = 0n;
    let previsao = 0n;
    let vencido = 0n;
    let parcelasProximas = 0;
    let parcelasEmAtraso = 0;

    const clientes = new Set<number>();
    const vinculosAusentes = new Set<number>();

    const metodos = {
      pix: 0n,
      boleto: 0n,
      cartao: 0n,
      outros: 0n,
    };

    for (const parcela of parcelas) {
      const pagamento = pagamentoPorId.get(parcela.idPagamento);
      if (!pagamento) continue;

      const obrigacao = obrigacaoPorId.get(pagamento.idObrigacao);
      if (!obrigacao) continue;

      const valor = this.centavos(parcela.valor);

      if (parcela.status === StatusParcela.PAGO) {
        const data = parcela.dataPagamento;

        if (!data || data < inicio || data >= fim) continue;

        recebido += valor;

        const mes = data.slice(0, 7);
        historico.set(mes, (historico.get(mes) ?? 0n) + valor);

        if (
          obrigacao.naturezaCobranca ===
          NaturezaCobranca.SERVICO_AVULSO
        ) {
          extras += valor;
        } else {
          mensalidades += valor;
        }

        const metodo = this.normalizarMetodo(
          pagamento.metodoPagamento,
        );
        metodos[metodo] += valor;

        const clienteId = clientePorObrigacao.get(obrigacao.id);

        if (clienteId !== undefined) {
          clientes.add(clienteId);
          receitaClientes += valor;
        } else {
          vinculosAusentes.add(obrigacao.id);
        }

        continue;
      }

      if (
        parcela.status !== StatusParcela.ATIVO &&
        parcela.status !== StatusParcela.ATRASADO
      ) {
        continue;
      }

      const vencimento = parcela.vencimento;

      if (vencimento >= inicio && vencimento < fim) {
        aReceber += valor;
      }

      if (vencimento >= dataHoje && vencimento < dataLimite) {
        previsao += valor;
        parcelasProximas++;
      }

      if (vencimento < dataHoje) {
        vencido += valor;
        parcelasEmAtraso++;
      }
    }

    for (const id of vinculosAusentes) {
      this.logger.warn(
        `Obrigação ${id} sem vínculo válido de cliente. ` +
          'Receita mantida no total e excluída do ticket médio.',
      );
    }

    return {
      faturamentoRecebido: this.reais(recebido),
      aReceber: this.reais(aReceber),
      receitaServicosExtras: this.reais(extras),
      ticketMedio: this.dividir(
        receitaClientes,
        BigInt(clientes.size),
      ),
      graficos: {
        historicoMensal: Array.from(historico, ([mes, valor]) => ({
          mes,
          valor: this.reais(valor),
        })),
        distribuicaoMetodoPagamento: {
          pix: this.percentual(metodos.pix, recebido),
          boleto: this.percentual(metodos.boleto, recebido),
          cartao: this.percentual(metodos.cartao, recebido),
          outros: this.percentual(metodos.outros, recebido),
        },
        distribuicaoTipoPagamento: {
          mensalidadeFixa: this.percentual(mensalidades, recebido),
          servicosAvulsos: this.percentual(extras, recebido),
        },
      },
      previsaoReceita30Dias: {
        valor: this.reais(previsao),
        parcelasProximas,
      },
      inadimplencia: {
        valorTotalVencido: this.reais(vencido),
        parcelasEmAtraso,
      },
    };
  }

  private async buscarClientes(
    obrigacoes: Obrigacao[],
  ): Promise<Map<number, number>> {
    const idsEmpresa = obrigacoes
      .filter((item) => item.tipo === TipoObrigacao.EMPRESA)
      .map((item) => item.id);

    const idsServico = obrigacoes
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

    const [empresas, solicitacoes] = await Promise.all([
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
      solicitacoes.map((item) => [item.id, item.usuarioId]),
    );

    const candidatos = new Map<number, number>();

    for (const vinculo of vinculosEmpresa) {
      const usuarioId = usuarioPorEmpresa.get(vinculo.idEmpresa);
      if (usuarioId !== undefined) {
        candidatos.set(vinculo.idObrigacao, usuarioId);
      }
    }

    for (const vinculo of vinculosServico) {
      const usuarioId = usuarioPorSolicitacao.get(
        vinculo.solicitacaoId,
      );
      if (usuarioId !== undefined) {
        candidatos.set(vinculo.idObrigacao, usuarioId);
      }
    }

    const idsUsuarios = [...new Set(candidatos.values())];

    const usuarios = idsUsuarios.length
      ? await this.usuarioModel.findAll({
          attributes: ['id'],
          where: { id: { [Op.in]: idsUsuarios } },
          paranoid: false,
        })
      : [];

    const usuariosExistentes = new Set(
      usuarios.map((item) => item.id),
    );

    return new Map(
      [...candidatos].filter(([, id]) => usuariosExistentes.has(id)),
    );
  }

  private normalizarMetodo(
    valor: string | null | undefined,
  ): 'pix' | 'boleto' | 'cartao' | 'outros' {
    const metodo = String(valor ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

    if (metodo === 'pix') return 'pix';
    if (metodo === 'boleto') return 'boleto';

    if (
      ['cartao', 'cartao de credito', 'cartao de debito'].includes(
        metodo,
      )
    ) {
      return 'cartao';
    }

    return 'outros';
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

  private reais(centavos: bigint): number {
    return Number(centavos) / 100;
  }

  private dividir(numerador: bigint, denominador: bigint): number {
    if (denominador === 0n) return 0;

    const sinal = numerador < 0n ? -1n : 1n;
    const absoluto = numerador * sinal;
    const arredondado =
      (absoluto * 2n + denominador) / (denominador * 2n);

    return this.reais(arredondado * sinal);
  }

  private percentual(parte: bigint, total: bigint): number {
    return total > 0n ? this.dividir(parte * 10000n, total) : 0;
  }
}