import { describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { RelatoriosController } from './relatorios.controller.js';

const ID = 'f2b25226-6efc-4cc9-82cf-b0ca79d79b8f';

function setup() {
  const service = {
    create: vi.fn(),
    findCategories: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    findPdf: vi.fn(),
    markPending: vi.fn(),
    remove: vi.fn(),
    simular: vi.fn(),
    downloadPdf: vi.fn(),
  };

  const producer = {
    adicionarGeracao: vi.fn().mockResolvedValue(undefined),
  };

  const pdfGenerator = {
    gerar: vi.fn(),
  };

  const controller = new RelatoriosController(
    service as any,
    producer as any,
    pdfGenerator as any,
  );

  return { controller, service, producer, pdfGenerator };
}

describe('RelatoriosController', () => {
  it('deve criar um relatório', async () => {
    const { controller, service } = setup();

    const data = {
      nome: 'Relatório Financeiro',
      categoria: 'Financeiro',
      descricao: 'Relatório financeiro mensal',
      data_inicio: '2026-09-01',
      data_termino: '2026-09-30',
    };

    const created = {
      id: ID,
      ...data,
      status: 'PENDENTE',
      arquivoUrl: null,
    };

    service.create.mockResolvedValue(created);

    expect(await controller.create(data as any)).toEqual(created);
    expect(service.create).toHaveBeenCalledWith(data);
  });

  it('deve retornar as categorias dos relatórios', async () => {
    const { controller, service } = setup();

    service.findCategories.mockResolvedValue(['Financeiro', 'Fiscal']);

    expect(await controller.findCategories()).toEqual([
      'Financeiro',
      'Fiscal',
    ]);
  });

  it('deve retornar relatórios com filtros e paginação', async () => {
    const { controller, service } = setup();

    const filters = {
      nome: 'Fin',
      status: 'GERADO',
      page: 2,
      limit: 10,
    };

    const result = {
      dados: [],
      total: 0,
      pagina: 2,
      limite: 10,
    };

    service.findAll.mockResolvedValue(result);

    expect(await controller.findAll(filters as any)).toEqual(result);
    expect(service.findAll).toHaveBeenCalledWith(filters);
  });

  it('coloca o relatório como PENDENTE e enfileira a geração', async () => {
    const { controller, service, producer } = setup();

    service.markPending.mockResolvedValue({ id: ID });

    const result = await controller.gerarRelatorio({
      relatorioId: ID,
    });

    expect(service.markPending).toHaveBeenCalledWith(ID);
    expect(producer.adicionarGeracao).toHaveBeenCalledWith(ID);

    expect(result).toEqual({
      mensagem: 'Job de geração de relatório enviado para a fila',
      relatorioId: ID,
      status: 'PENDENTE',
    });
  });

  it('não enfileira quando o relatório não existe', async () => {
    const { controller, service, producer } = setup();

    service.markPending.mockRejectedValue(new NotFoundException());

    await expect(
      controller.gerarRelatorio({ relatorioId: ID }),
    ).rejects.toThrow(NotFoundException);

    expect(producer.adicionarGeracao).not.toHaveBeenCalled();
  });

  it('busca um relatório pelo ID', async () => {
    const { controller, service } = setup();

    service.findOne.mockResolvedValue({ id: ID });

    expect(await controller.buscarRelatorio(ID)).toEqual({ id: ID });
    expect(service.findOne).toHaveBeenCalledWith(ID);
  });

  it('envia o PDF diretamente para download pelo ID', async () => {
    const { controller, service } = setup();

    const url = 'https://x/a.pdf';
    const pdf = Buffer.from('%PDF-1.4 teste');

    service.findPdf.mockResolvedValue({
      id: ID,
      url,
    });

    service.downloadPdf.mockResolvedValue(pdf);

    const response = {
      set: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };

    await controller.buscarPdf(ID, response as any);

    expect(service.findPdf).toHaveBeenCalledWith(ID);
    expect(service.downloadPdf).toHaveBeenCalledWith(url);

    expect(response.set).toHaveBeenCalledWith({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="relatorio-${ID}.pdf"`,
      'Content-Length': String(pdf.length),
    });

    expect(response.send).toHaveBeenCalledWith(pdf);
  });

  it('propaga 404 quando o PDF não existe', async () => {
    const { controller, service } = setup();

    service.findPdf.mockRejectedValue(new NotFoundException());

    const response = {
      set: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };

    await expect(
      controller.buscarPdf(ID, response as any),
    ).rejects.toThrow(NotFoundException);

    expect(service.downloadPdf).not.toHaveBeenCalled();
    expect(response.send).not.toHaveBeenCalled();
  });

  it('exclui um relatório pelo ID', async () => {
    const { controller, service } = setup();

    const result = {
      mensagem: 'Relatório excluído com sucesso',
      id: ID,
    };

    service.remove.mockResolvedValue(result);

    expect(await controller.excluirRelatorio(ID)).toEqual(result);
    expect(service.remove).toHaveBeenCalledWith(ID);
  });

  it('delega a simulação ao serviço', () => {
    const { controller, service } = setup();

    const dto = {
      impostos: 1,
      multas: 2,
      honorarios: 3,
    };

    service.simular.mockReturnValue({ total: 6 });

    expect(controller.simular(dto as any)).toEqual({ total: 6 });
    expect(service.simular).toHaveBeenCalledWith(dto);
  });

  it('envia o PDF diretamente com os headers de preview', async () => {
    const { controller, pdfGenerator } = setup();

    const pdf = Buffer.from('%PDF-test');

    pdfGenerator.gerar.mockResolvedValue(pdf);

    const response = {
      set: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };

    const dto = {
      titulo: 'R',
      nomeCliente: 'C',
      itens: [],
    };

    await controller.preview(dto as any, response as any);

    expect(pdfGenerator.gerar).toHaveBeenCalledWith(dto);

    expect(response.set).toHaveBeenCalledWith({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline',
      'Content-Length': String(pdf.length),
    });

    expect(response.send).toHaveBeenCalledWith(pdf);
  });

  it('propaga o erro do gerador de preview', async () => {
    const { controller, pdfGenerator } = setup();

    const error = new Error('Falha ao gerar PDF');

    pdfGenerator.gerar.mockRejectedValue(error);

    const response = {
      set: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };

    await expect(
      controller.preview({} as any, response as any),
    ).rejects.toThrow(error);

    expect(response.send).not.toHaveBeenCalled();
  });
});