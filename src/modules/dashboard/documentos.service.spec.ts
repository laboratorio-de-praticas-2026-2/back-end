import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock as VitestMock } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { Op } from 'sequelize';
import { DocumentosService } from './documentos.service.js';
import { StatusSolicitacaoEnum } from '../../commons/enums/status-solicitacao.enum.js';
import { StatusValidacaoDocumentoEnum } from '../../commons/enums/status-validacao-documento.enum.js';
import { resolvePeriodo } from '../../commons/utils/periodo-filtro.util.js';

type Mock = VitestMock<(...args: any[]) => Promise<any>>;
const criarMock = (): Mock => vi.fn<(...args: any[]) => Promise<any>>();

const periodo = resolvePeriodo('2026-09-01', '2026-09-30');

describe('DocumentosService', () => {
  let documentoModel: { findAll: Mock };
  let solicitacaoModel: { count: Mock };
  let service: DocumentosService;

  // findAll é chamado 2x: os "cards" (têm `group`) e as "travadas" (não têm).
  const configurar = (cards: unknown[], travadas: unknown[], parados = 0) => {
    documentoModel.findAll.mockImplementation(async (opts: any) => (opts.group ? cards : travadas));
    solicitacaoModel.count.mockResolvedValue(parados);
  };

  const chamadaCards = () => documentoModel.findAll.mock.calls.map((c) => c[0]).find((o: any) => o.group);
  const chamadaTravadas = () => documentoModel.findAll.mock.calls.map((c) => c[0]).find((o: any) => !o.group);

  beforeEach(() => {
    documentoModel = { findAll: criarMock() };
    solicitacaoModel = { count: criarMock() };
    service = new DocumentosService(documentoModel as any, solicitacaoModel as any);
  });

  // ──────────────────────────────── Cards ──────────────────────────────────
  describe('cards', () => {
    it('recebidos = todos os status; processados = aprovados; incorretos = rejeitados', async () => {
      configurar(
        [
          { statusValidacao: StatusValidacaoDocumentoEnum.PENDENTE, quantidade: '5' }, // aguardando validação
          { statusValidacao: StatusValidacaoDocumentoEnum.APROVADO, quantidade: '12' },
          { statusValidacao: StatusValidacaoDocumentoEnum.REJEITADO, quantidade: '3' },
        ],
        [],
        4,
      );

      const r = await service.getIndicadores('2026-09-01', '2026-09-30');

      expect(r.cards).toEqual({ recebidos: 20, processados: 12, incorretos: 3, processosParados: 4 });
    });

    it('"recebido" exige nomeHash preenchido e não vazio, e dataUpload no período', async () => {
      configurar([], []);
      await service.getIndicadores('2026-09-01', '2026-09-30');

      const { where, include } = chamadaCards();
      expect(where.nomeHash[Op.and]).toEqual([{ [Op.ne]: null }, { [Op.ne]: '' }]);
      expect(where.dataUpload[Op.gte]).toEqual(periodo.rangeStart);
      expect(where.dataUpload[Op.lt]).toEqual(periodo.rangeEndExclusive);
      // required: true faz o INNER JOIN respeitar o soft delete da solicitação
      expect(include[0].required).toBe(true);
    });

    it('processosParados conta solicitações aguardando_documento criadas no período', async () => {
      configurar([], [], 4);
      await service.getIndicadores('2026-09-01', '2026-09-30');

      const { where } = solicitacaoModel.count.mock.calls[0][0];
      expect(where.status).toBe(StatusSolicitacaoEnum.AGUARDANDO_DOCUMENTO);
      expect(where.dataSolicitacao[Op.gte]).toEqual(periodo.rangeStart);
      expect(where.dataSolicitacao[Op.lt]).toEqual(periodo.rangeEndExclusive);
    });
  });

  // ───────────────────────── Travadas por tipo ─────────────────────────────
  describe('travadasPorFaltaDeDocumento', () => {
    it('conta solicitações DISTINTAS por tipo, ordenando por quantidade (contrato de exemplo)', async () => {
      configurar(
        [],
        [
          { tipoDocumento: 'Extratos Bancários', solicitacaoId: 1 },
          { tipoDocumento: 'Extratos Bancários', solicitacaoId: 1 }, // duplicado na mesma solicitação
          { tipoDocumento: 'Extratos Bancários', solicitacaoId: 2 },
          { tipoDocumento: 'Extratos Bancários', solicitacaoId: 3 },
          { tipoDocumento: 'Notas Fiscais', solicitacaoId: 1 }, // mesma solicitação, outro tipo
          { tipoDocumento: 'Notas Fiscais', solicitacaoId: 2 },
        ],
      );

      const r = await service.getIndicadores('2026-09-01', '2026-09-30');

      expect(r.travadasPorFaltaDeDocumento).toEqual([
        { tipoDocumento: 'Extratos Bancários', quantidade: 3 },
        { tipoDocumento: 'Notas Fiscais', quantidade: 2 },
      ]);
    });

    it('uma solicitação com vários tipos faltantes aparece em cada tipo', async () => {
      configurar(
        [],
        [
          { tipoDocumento: 'Contrato Social', solicitacaoId: 7 },
          { tipoDocumento: 'RG', solicitacaoId: 7 },
        ],
      );

      const r = await service.getIndicadores('2026-09-01', '2026-09-30');

      expect(r.travadasPorFaltaDeDocumento).toEqual([
        { tipoDocumento: 'Contrato Social', quantidade: 1 },
        { tipoDocumento: 'RG', quantidade: 1 },
      ]);
    });

    it('desempata quantidades iguais por ordem alfabética do tipo', async () => {
      configurar(
        [],
        [
          { tipoDocumento: 'Zeta', solicitacaoId: 1 },
          { tipoDocumento: 'Alfa', solicitacaoId: 2 },
        ],
      );

      const r = await service.getIndicadores('2026-09-01', '2026-09-30');

      expect(r.travadasPorFaltaDeDocumento.map((t: any) => t.tipoDocumento)).toEqual(['Alfa', 'Zeta']);
    });

    it('a consulta pega não enviados OU rejeitados, com tipo preenchido, em solicitações aguardando_documento do período', async () => {
      configurar([], []);
      await service.getIndicadores('2026-09-01', '2026-09-30');

      const { where, include } = chamadaTravadas();
      expect(where.tipoDocumento[Op.ne]).toBeNull();
      expect(where[Op.or]).toEqual([
        { nomeHash: null, dataUpload: null },
        { statusValidacao: StatusValidacaoDocumentoEnum.REJEITADO },
      ]);
      // enviado e aguardando validação (pendente com nomeHash) NÃO casa com nenhuma das duas condições
      expect(include[0].required).toBe(true);
      expect(include[0].where.status).toBe(StatusSolicitacaoEnum.AGUARDANDO_DOCUMENTO);
      expect(include[0].where.dataSolicitacao[Op.gte]).toEqual(periodo.rangeStart);
    });
  });

  // ───────────────────────── Sem dados e período ───────────────────────────
  describe('getIndicadores', () => {
    it('período sem dados: cards zerados e lista vazia', async () => {
      configurar([], [], 0);

      const r = await service.getIndicadores('2026-09-01', '2026-09-30');

      expect(r).toEqual({
        cards: { recebidos: 0, processados: 0, incorretos: 0, processosParados: 0 },
        travadasPorFaltaDeDocumento: [],
      });
    });

    it('lança 400 para período inválido e não consulta o banco', async () => {
      await expect(service.getIndicadores('2026-09-30', '2026-09-01')).rejects.toBeInstanceOf(BadRequestException);
      expect(documentoModel.findAll).not.toHaveBeenCalled();
    });
  });
});