import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, col, fn } from 'sequelize';
import { DocumentoSolicitacao } from '../../models/documento-solicitacao.model.js';
import { Solicitacao } from '../../models/solicitacao.model.js';
import { StatusSolicitacaoEnum } from '../../commons/enums/status-solicitacao.enum.js';
import { StatusValidacaoDocumentoEnum } from '../../commons/enums/status-validacao-documento.enum.js';
import { PeriodoFiltro, resolvePeriodo } from '../../commons/utils/periodo-filtro.util.js';

@Injectable()
export class DocumentosService {
  constructor(
    @InjectModel(DocumentoSolicitacao)
    private readonly documentoModel: typeof DocumentoSolicitacao,
    @InjectModel(Solicitacao)
    private readonly solicitacaoModel: typeof Solicitacao,
  ) { }

  async getIndicadores(startDate?: string, endDate?: string) {
    const periodo = resolvePeriodo(startDate, endDate);

    const [cards, travadasPorFaltaDeDocumento] = await Promise.all([
      this.getCards(periodo),
      this.getTravadasPorFaltaDeDocumento(periodo),
    ]);

    return { cards, travadasPorFaltaDeDocumento };
  }

  private async getCards(periodo: PeriodoFiltro) {
    const rows = (await this.documentoModel.findAll({
      attributes: ['statusValidacao', [fn('COUNT', col('DocumentoSolicitacao.id')), 'quantidade']],
      where: {
        // "recebidos": efetivamente enviados (nomeHash preenchido e não vazio)
        nomeHash: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] },
        dataUpload: {
          [Op.gte]: periodo.rangeStart,
          [Op.lt]: periodo.rangeEndExclusive,
        },
      },
      include: [
        {
          model: Solicitacao,
          as: 'solicitacao',
          attributes: [],
          required: true, // garante que a solicitação não esteja deletada (paranoid)
        },
      ],
      group: [col('DocumentoSolicitacao.status_validacao')],
      raw: true,
    })) as unknown as { statusValidacao: StatusValidacaoDocumentoEnum; quantidade: string }[];

    const contagemPorStatus = new Map<StatusValidacaoDocumentoEnum, number>();
    for (const row of rows) {
      contagemPorStatus.set(row.statusValidacao, Number(row.quantidade));
    }

    const recebidos = Array.from(contagemPorStatus.values()).reduce((acc, qtd) => acc + qtd, 0);
    const processados = contagemPorStatus.get(StatusValidacaoDocumentoEnum.APROVADO) ?? 0;
    const incorretos = contagemPorStatus.get(StatusValidacaoDocumentoEnum.REJEITADO) ?? 0;

    const processosParados = await this.solicitacaoModel.count({
      where: {
        status: StatusSolicitacaoEnum.AGUARDANDO_DOCUMENTO,
        dataSolicitacao: {
          [Op.gte]: periodo.rangeStart,
          [Op.lt]: periodo.rangeEndExclusive,
        },
      },
    });

    return { recebidos, processados, incorretos, processosParados };
  }

  private async getTravadasPorFaltaDeDocumento(periodo: PeriodoFiltro) {
    const rows = (await this.documentoModel.findAll({
      attributes: ['tipoDocumento', 'solicitacaoId'],
      where: {
        // registros sem tipo não entram no gráfico (a coluna aceita nulo)
        tipoDocumento: { [Op.ne]: null },
        [Op.or]: [
          { nomeHash: null, dataUpload: null },
          { statusValidacao: StatusValidacaoDocumentoEnum.REJEITADO },
        ],
      },
      include: [
        {
          model: Solicitacao,
          as: 'solicitacao',
          attributes: [],
          required: true,
          where: {
            status: StatusSolicitacaoEnum.AGUARDANDO_DOCUMENTO,
            dataSolicitacao: {
              [Op.gte]: periodo.rangeStart,
              [Op.lt]: periodo.rangeEndExclusive,
            },
          },
        },
      ],
      raw: true,
    })) as unknown as { tipoDocumento: string; solicitacaoId: number }[];

    const solicitacoesPorTipo = new Map<string, Set<number>>();
    for (const row of rows) {
      if (!row.tipoDocumento?.trim()) continue;

      const conjunto =
        solicitacoesPorTipo.get(row.tipoDocumento) ?? new Set<number>();

      conjunto.add(row.solicitacaoId);
      solicitacoesPorTipo.set(row.tipoDocumento, conjunto);
    }

    return Array.from(solicitacoesPorTipo.entries())
      .map(([tipoDocumento, solicitacoes]) => ({
        tipoDocumento,
        quantidade: solicitacoes.size,
      }))
      .sort((a, b) => b.quantidade - a.quantidade || a.tipoDocumento.localeCompare(b.tipoDocumento));
  }
}