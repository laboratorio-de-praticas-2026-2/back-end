import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Mock as VitestMock } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { Op } from 'sequelize';
import { SolicitacoesService } from './solicitacoes.service.js';
import { StatusSolicitacaoEnum } from '../../commons/enums/status-solicitacao.enum.js';
import { StatusParcelaEnum } from '../../commons/enums/status-parcela.enum.js';
import { NaturezaCobrancaEnum } from '../../commons/enums/natureza-cobranca.enum.js';
import { resolvePeriodo } from '../../commons/utils/periodo-filtro.util.js';

type Mock = VitestMock<(...args: any[]) => Promise<any>>;
const criarMock = (): Mock => vi.fn<(...args: any[]) => Promise<any>>();

const periodo = resolvePeriodo('2026-09-01', '2026-09-30');

describe('SolicitacoesService', () => {
  let solicitacaoModel: { findAll: Mock };
  let obrigacaoServicoModel: { findAll: Mock };
  let parcelaModel: { findOne: Mock };
  let service: SolicitacoesService;

  // Os métodos são privados; chamamos por aqui para testar cada regra isoladamente.
  const chamar = (metodo: string, ...args: unknown[]) => (service as any)[metodo](...args);

  beforeEach(() => {
    // "Hoje" fixo: 29/09/2026 12h em São Paulo
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-29T15:00:00Z'));

    solicitacaoModel = { findAll: criarMock() };
    obrigacaoServicoModel = { findAll: criarMock() };
    parcelaModel = { findOne: criarMock() };
    service = new SolicitacoesService(
      solicitacaoModel as any,
      obrigacaoServicoModel as any,
      parcelaModel as any,
    );
  });

  afterEach(() => vi.useRealTimers());

  // ─────────────────────────── Gráfico de status ───────────────────────────
  describe('getGraficoStatus', () => {
    it('agrupa os status e calcula percentuais e taxa de cancelamento (valores conhecidos)', async () => {
      solicitacaoModel.findAll.mockResolvedValue([
        { status: StatusSolicitacaoEnum.RECEBIDO, quantidade: '2' },
        { status: StatusSolicitacaoEnum.AGUARDANDO_PAGAMENTO, quantidade: '1' },
        { status: StatusSolicitacaoEnum.EM_ANDAMENTO, quantidade: '2' }, // emAberto = 5
        { status: StatusSolicitacaoEnum.CONCLUIDO, quantidade: '3' },
        { status: StatusSolicitacaoEnum.AGUARDANDO_DOCUMENTO, quantidade: '2' },
        { status: StatusSolicitacaoEnum.CANCELADO, quantidade: '2' },
      ]);

      const r = await chamar('getGraficoStatus', periodo);

      // canceladas ficam fora do total e do gráfico
      expect(r.grafico).toEqual({
        totalSolicitacoes: 10,
        emAberto: 50,
        concluidas: 30,
        documentosPendentes: 20,
      });
      // denominador da taxa INCLUI as canceladas: 2 / (10 + 2)
      expect(r.taxaCancelamento).toBe(16.67);
    });

    it('arredonda cada percentual individualmente (soma pode diferir em 0,01)', async () => {
      solicitacaoModel.findAll.mockResolvedValue([
        { status: StatusSolicitacaoEnum.RECEBIDO, quantidade: '1' },
        { status: StatusSolicitacaoEnum.CONCLUIDO, quantidade: '1' },
        { status: StatusSolicitacaoEnum.AGUARDANDO_DOCUMENTO, quantidade: '1' },
      ]);

      const r = await chamar('getGraficoStatus', periodo);

      expect(r.grafico.emAberto).toBe(33.33);
      expect(r.grafico.concluidas).toBe(33.33);
      expect(r.grafico.documentosPendentes).toBe(33.33);
    });

    it('sem dados: tudo zerado, sem divisão por zero', async () => {
      solicitacaoModel.findAll.mockResolvedValue([]);

      const r = await chamar('getGraficoStatus', periodo);

      expect(r.grafico).toEqual({
        totalSolicitacoes: 0,
        emAberto: 0,
        concluidas: 0,
        documentosPendentes: 0,
      });
      expect(r.taxaCancelamento).toBe(0);
    });

    it('filtra por dataSolicitacao dentro do período', async () => {
      solicitacaoModel.findAll.mockResolvedValue([]);
      await chamar('getGraficoStatus', periodo);

      const { where } = solicitacaoModel.findAll.mock.calls[0][0];
      expect(where.dataSolicitacao[Op.gte]).toEqual(periodo.rangeStart);
      expect(where.dataSolicitacao[Op.lt]).toEqual(periodo.rangeEndExclusive);
    });
  });

  // ─────────────────────────────── Prazos ──────────────────────────────────
  // Hoje = 2026-09-29. Janela "próximas" = 29/09 até 06/10, inclusive.
  describe('getPrazos', () => {
    const sol = (id: number, abertura: string, prazo: number | null) => ({
      id,
      dataSolicitacao: new Date(abertura),
      servico: { prazoEstimadoDias: prazo },
    });

    const casos = [
      { nome: 'vence hoje', abertura: '2026-09-24T15:00:00Z', prazo: 5, esperado: { proximasDeVencer: 1, foraDoPrazo: 0 } },
      { nome: 'vence em 7 dias (limite inclusivo)', abertura: '2026-09-29T15:00:00Z', prazo: 7, esperado: { proximasDeVencer: 1, foraDoPrazo: 0 } },
      { nome: 'vence em 8 dias (fora da janela)', abertura: '2026-09-29T15:00:00Z', prazo: 8, esperado: { proximasDeVencer: 0, foraDoPrazo: 0 } },
      { nome: 'venceu ontem', abertura: '2026-09-20T15:00:00Z', prazo: 8, esperado: { proximasDeVencer: 0, foraDoPrazo: 1 } },
      { nome: 'prazo zero aberta hoje (vence hoje)', abertura: '2026-09-29T15:00:00Z', prazo: 0, esperado: { proximasDeVencer: 1, foraDoPrazo: 0 } },
      { nome: 'prazo nulo é ignorado', abertura: '2026-09-20T15:00:00Z', prazo: null, esperado: { proximasDeVencer: 0, foraDoPrazo: 0 } },
      { nome: 'prazo negativo é ignorado', abertura: '2026-09-20T15:00:00Z', prazo: -1, esperado: { proximasDeVencer: 0, foraDoPrazo: 0 } },
      // 02:00Z de 29/09 = 23h de 28/09 em São Paulo -> data local 28/09 -> venceu
      { nome: 'usa a data LOCAL de abertura (São Paulo)', abertura: '2026-09-29T02:00:00Z', prazo: 0, esperado: { proximasDeVencer: 0, foraDoPrazo: 1 } },
    ];

    for (const c of casos) {
      it(c.nome, async () => {
        solicitacaoModel.findAll.mockResolvedValue([sol(1, c.abertura, c.prazo)]);
        expect(await chamar('getPrazos', periodo)).toEqual(c.esperado);
      });
    }

    it('cenário misto soma corretamente cada grupo', async () => {
      solicitacaoModel.findAll.mockResolvedValue([
        sol(1, '2026-09-24T15:00:00Z', 5), // hoje
        sol(2, '2026-09-29T15:00:00Z', 7), // +7
        sol(3, '2026-09-29T15:00:00Z', 8), // +8 (nenhum)
        sol(4, '2026-09-20T15:00:00Z', 8), // vencida
        sol(5, '2026-09-20T15:00:00Z', null), // sem prazo
      ]);
      expect(await chamar('getPrazos', periodo)).toEqual({ proximasDeVencer: 2, foraDoPrazo: 1 });
    });

    it('a consulta exclui concluídas e canceladas e filtra por dataSolicitacao', async () => {
      solicitacaoModel.findAll.mockResolvedValue([]);
      await chamar('getPrazos', periodo);

      const { where } = solicitacaoModel.findAll.mock.calls[0][0];
      expect(where.status[Op.notIn]).toEqual(
        expect.arrayContaining([StatusSolicitacaoEnum.CONCLUIDO, StatusSolicitacaoEnum.CANCELADO]),
      );
      expect(where.dataSolicitacao[Op.gte]).toEqual(periodo.rangeStart);
    });
  });

  // ────────────────────────────── Tempo médio ──────────────────────────────
  describe('getTempoMedio', () => {
    const conc = (abertura: string, conclusao: string | null, servico: { id: number; nome: string } | null) => ({
      dataSolicitacao: new Date(abertura),
      dataConclusao: conclusao ? new Date(conclusao) : null,
      servico,
    });
    const A = { id: 1, nome: 'Serviço A' };
    const B = { id: 2, nome: 'Serviço B' };
    const C = { id: 3, nome: 'Serviço C' };

    it('calcula durações fracionadas, média geral ponderada e ordenação', async () => {
      solicitacaoModel.findAll.mockResolvedValue([
        conc('2026-09-01T00:00:00Z', '2026-09-02T12:00:00Z', A), // 1,5 dia
        conc('2026-09-10T00:00:00Z', '2026-09-12T12:00:00Z', A), // 2,5 dias
        conc('2026-09-01T00:00:00Z', '2026-09-05T00:00:00Z', B), // 4 dias
        conc('2026-09-01T00:00:00Z', '2026-09-03T00:00:00Z', C), // 2 dias
      ]);

      const r = await chamar('getTempoMedio', periodo);

      // decrescente por tempo; empate (A=2 e C=2) desempata por servicoId
      expect(r.porServico).toEqual([
        { servicoId: 2, servicoNome: 'Serviço B', tempoMedio: 4 },
        { servicoId: 1, servicoNome: 'Serviço A', tempoMedio: 2 },
        { servicoId: 3, servicoNome: 'Serviço C', tempoMedio: 2 },
      ]);
      // geral = 10 / 4 = 2,5 (e NÃO a média das médias, que daria 2,67)
      expect(r.geral).toBe(2.5);
    });

    it('descarta datas ausentes, conclusão anterior à abertura e serviço ausente', async () => {
      solicitacaoModel.findAll.mockResolvedValue([
        conc('2026-09-01T00:00:00Z', '2026-09-02T00:00:00Z', A), // válida: 1 dia
        conc('2026-09-05T00:00:00Z', '2026-09-01T00:00:00Z', A), // conclusão < abertura
        conc('2026-09-05T00:00:00Z', null, A), // sem dataConclusao
        conc('2026-09-01T00:00:00Z', '2026-09-03T00:00:00Z', null), // sem serviço
      ]);

      const r = await chamar('getTempoMedio', periodo);

      expect(r.porServico).toEqual([{ servicoId: 1, servicoNome: 'Serviço A', tempoMedio: 1 }]);
      expect(r.geral).toBe(1);
    });

    it('sem conclusões válidas: lista vazia e média geral null', async () => {
      solicitacaoModel.findAll.mockResolvedValue([]);
      const r = await chamar('getTempoMedio', periodo);
      expect(r).toEqual({ porServico: [], geral: null });
    });

    it('considera apenas concluídas, filtrando por dataConclusao', async () => {
      solicitacaoModel.findAll.mockResolvedValue([]);
      await chamar('getTempoMedio', periodo);

      const { where } = solicitacaoModel.findAll.mock.calls[0][0];
      expect(where.status).toBe(StatusSolicitacaoEnum.CONCLUIDO);
      expect(where.dataConclusao[Op.gte]).toEqual(periodo.rangeStart);
      expect(where.dataConclusao[Op.lt]).toEqual(periodo.rangeEndExclusive);
    });
  });

  // ─────────────────────────── Créditos em aberto ──────────────────────────
  describe('getTotalCreditosAberto', () => {
    it('soma as parcelas das obrigações elegíveis (números, não string)', async () => {
      obrigacaoServicoModel.findAll.mockResolvedValue([{ obrigacaoId: 10 }, { obrigacaoId: 11 }]);
      parcelaModel.findOne.mockResolvedValue({ total: '1500.50' });

      expect(await chamar('getTotalCreditosAberto', periodo)).toBe(1500.5);

      const call = parcelaModel.findOne.mock.calls[0][0];
      expect(call.where.status[Op.in]).toEqual([StatusParcelaEnum.ATIVO, StatusParcelaEnum.ATRASADO]);
      expect(call.include[0].where.obrigacaoId[Op.in]).toEqual([10, 11]);
    });

    it('seleciona só mensalidade e serviço avulso (exclui tributo) e solicitações não canceladas', async () => {
      obrigacaoServicoModel.findAll.mockResolvedValue([]);
      await chamar('getTotalCreditosAberto', periodo);

      const { include } = obrigacaoServicoModel.findAll.mock.calls[0][0];
      const incObrigacao = include.find((i: any) => i.as === 'obrigacao');
      const incSolicitacao = include.find((i: any) => i.as === 'solicitacao');

      expect(incObrigacao.where.naturezaCobranca[Op.in]).toEqual([
        NaturezaCobrancaEnum.MENSALIDADE,
        NaturezaCobrancaEnum.SERVICO_AVULSO,
      ]);
      expect(incObrigacao.where.naturezaCobranca[Op.in]).not.toContain(NaturezaCobrancaEnum.TRIBUTO);
      expect(incSolicitacao.where.status[Op.ne]).toBe(StatusSolicitacaoEnum.CANCELADO);
      expect(incSolicitacao.where.dataSolicitacao[Op.gte]).toEqual(periodo.rangeStart);
    });

    it('sem obrigações elegíveis: retorna 0 sem consultar parcelas', async () => {
      obrigacaoServicoModel.findAll.mockResolvedValue([]);

      expect(await chamar('getTotalCreditosAberto', periodo)).toBe(0);
      expect(parcelaModel.findOne).not.toHaveBeenCalled();
    });

    it('SUM nulo (nenhuma parcela em aberto) vira 0', async () => {
      obrigacaoServicoModel.findAll.mockResolvedValue([{ obrigacaoId: 10 }]);
      parcelaModel.findOne.mockResolvedValue({ total: null });

      expect(await chamar('getTotalCreditosAberto', periodo)).toBe(0);
    });
  });

  // ──────────────────────── Contrato e período ─────────────────────────────
  describe('getIndicadores', () => {
    it('período sem dados: contadores zerados, listas vazias e média geral null', async () => {
      solicitacaoModel.findAll.mockResolvedValue([]);
      obrigacaoServicoModel.findAll.mockResolvedValue([]);

      const r = await service.getIndicadores('2026-09-01', '2026-09-30');

      expect(r).toEqual({
        graficoStatus: { totalSolicitacoes: 0, emAberto: 0, concluidas: 0, documentosPendentes: 0 },
        taxaCancelamento: 0,
        totalCreditosAberto: 0,
        prazos: { proximasDeVencer: 0, foraDoPrazo: 0 },
        tempoMedioPorServicoDias: [],
        tempoMedioGeralDias: null,
      });
    });

    it('lança 400 para datas inválidas e não consulta o banco', async () => {
      await expect(service.getIndicadores('2026-09-01')).rejects.toBeInstanceOf(BadRequestException);
      await expect(service.getIndicadores('2026-02-30', '2026-03-01')).rejects.toBeInstanceOf(BadRequestException);
      expect(solicitacaoModel.findAll).not.toHaveBeenCalled();
    });
  });
});