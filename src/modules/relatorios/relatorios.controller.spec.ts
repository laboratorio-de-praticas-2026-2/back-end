import { describe, expect, it, vi } from 'vitest';

import { BadRequestException, ParseUUIDPipe } from '@nestjs/common';

import { RelatoriosController } from './relatorios.controller.js';

describe('RelatoriosController', () => {
  const createService = () => ({
    create: vi.fn(),
    findCategories: vi.fn(),
    findAll: vi.fn(),
    findById: vi.fn(),
    updateStatus: vi.fn(),
    delete: vi.fn(),
    simular: vi.fn(),
  });

  const createProducer = () => ({
    adicionarGeracao: vi.fn(),
  });

  const createPdfGenerator = () => ({
    gerar: vi.fn(),
  });

  const createCloudinaryService = () => ({
    downloadPdf: vi.fn(),
  });

  it('deve estar definido', () => {
    const service = createService();
    const producer = createProducer();
    const pdfGeneratorService = createPdfGenerator();
    const cloudinaryService = createCloudinaryService();

    const controller = new RelatoriosController(
      service as any,
      producer as any,
      pdfGeneratorService as any,
      cloudinaryService as any,
    );

    expect(controller).toBeDefined();
  });

  it('deve criar um relatório', async () => {
    const service = createService();

    const data = {
      nome: 'Relatório Financeiro',
      categoria: 'Financeiro',
      descricao: 'Relatório financeiro mensal',
      data_inicio: '2026-09-01',
      data_termino: '2026-09-30',
    };

    const createdReport = {
      id: 'f2b25226-6efc-4cc9-82cf-b0ca79d79b8f',
      nome: 'Relatório Financeiro',
      categoria: 'Financeiro',
      descricao: 'Relatório financeiro mensal',
      dataInicio: new Date('2026-09-01'),
      dataTermino: new Date('2026-09-30'),
      status: 'PENDENTE',
      arquivoUrl: null,
    };

    service.create.mockResolvedValue(createdReport);

    const controller = new RelatoriosController(
      service as any,
      createProducer() as any,
      createPdfGenerator() as any,
      createCloudinaryService() as any,
    );

    const result = await controller.create(data as any);

    expect(result).toEqual(createdReport);
    expect(service.create).toHaveBeenCalledWith(data);
  });

  it('deve retornar as categorias dos relatórios', async () => {
    const service = createService();

    const categories = ['Financeiro', 'Fiscal', 'Contábil'];

    service.findCategories.mockResolvedValue(categories);

    const controller = new RelatoriosController(
      service as any,
      createProducer() as any,
      createPdfGenerator() as any,
      createCloudinaryService() as any,
    );

    const result = await controller.findCategories();

    expect(result).toEqual(categories);
    expect(service.findCategories).toHaveBeenCalledWith();
  });

  it('deve retornar relatórios com filtros', async () => {
    const service = createService();

    const filters = {
      nome: 'Financeiro',
      categoria: 'Financeiro',
      status: 'PENDENTE' as const,
      data_inicio: '2026-09-01',
      data_termino: '2026-09-30',
      page: 1,
      limit: 10,
    };

    const response = {
      dados: [
        {
          id: 'f2b25226-6efc-4cc9-82cf-b0ca79d79b8f',
          nome: 'Relatório Financeiro',
          categoria: 'Financeiro',
          status: 'PENDENTE',
        },
      ],
      total: 1,
      pagina: 1,
      limite: 10,
      temProximaPagina: false,
    };

    service.findAll.mockResolvedValue(response);

    const controller = new RelatoriosController(
      service as any,
      createProducer() as any,
      createPdfGenerator() as any,
      createCloudinaryService() as any,
    );

    const result = await controller.findAll(filters as any);

    expect(result).toEqual(response);
    expect(service.findAll).toHaveBeenCalledWith(filters);
  });

  it('deve colocar o relatório como pendente e enviar para a fila', async () => {
    const service = createService();
    const producer = createProducer();

    const relatorioId =
      'f2b25226-6efc-4cc9-82cf-b0ca79d79b8f';

    const relatorio = {
      id: relatorioId,
      nome: 'Relatório Financeiro',
      status: 'GERADO',
    };

    service.findById.mockResolvedValue(relatorio);

    service.updateStatus.mockResolvedValue({
      ...relatorio,
      status: 'PENDENTE',
    });

    const controller = new RelatoriosController(
      service as any,
      producer as any,
      createPdfGenerator() as any,
      createCloudinaryService() as any,
    );

    const resposta = await controller.gerarRelatorio({
      relatorioId,
    });

    expect(service.findById).toHaveBeenCalledWith(relatorioId);

    expect(service.updateStatus).toHaveBeenCalledWith(
      relatorioId,
      'PENDENTE',
    );

    expect(producer.adicionarGeracao).toHaveBeenCalledWith(
      relatorioId,
    );

    expect(resposta).toEqual({
      mensagem: 'Job de geração de relatório enviado para a fila',
      relatorioId,
      status: 'PENDENTE',
    });
  });

  it('deve rejeitar relatório inexistente ao gerar PDF', async () => {
    const service = createService();

    const relatorioId =
      'f2b25226-6efc-4cc9-82cf-b0ca79d79b8f';

    service.findById.mockRejectedValue(
      new Error('Relatório não encontrado'),
    );

    const controller = new RelatoriosController(
      service as any,
      createProducer() as any,
      createPdfGenerator() as any,
      createCloudinaryService() as any,
    );

    await expect(
      controller.gerarRelatorio({
        relatorioId,
      }),
    ).rejects.toThrow('Relatório não encontrado');

    expect(service.updateStatus).not.toHaveBeenCalled();
  });

  it('deve buscar um relatório pelo ID', async () => {
    const service = createService();

    const relatorioId =
      'f2b25226-6efc-4cc9-82cf-b0ca79d79b8f';

    const relatorio = {
      id: relatorioId,
      nome: 'Relatório teste',
      categoria: 'Financeiro',
      descricao: 'Teste',
      status: 'GERADO',
      arquivoUrl:
        'https://res.cloudinary.com/teste/relatorio.pdf',
    };

    service.findById.mockResolvedValue(relatorio);

    const controller = new RelatoriosController(
      service as any,
      createProducer() as any,
      createPdfGenerator() as any,
      createCloudinaryService() as any,
    );

    const resposta = await controller.buscarRelatorio(
      relatorioId,
    );

    expect(resposta).toEqual(relatorio);
    expect(service.findById).toHaveBeenCalledWith(relatorioId);
  });

  it('deve rejeitar ID inválido ao buscar relatório', async () => {
    const service = createService();
    const pipe = new ParseUUIDPipe();

    await expect(
      pipe.transform(''),
    ).rejects.toThrow(BadRequestException);

    expect(service.findById).not.toHaveBeenCalled();
  });

  it('deve buscar o PDF de um relatório pelo ID', async () => {
    const service = createService();

    const relatorioId =
      'f2b25226-6efc-4cc9-82cf-b0ca79d79b8f';

    const arquivoUrl =
      'https://res.cloudinary.com/teste/raw/upload/relatorios/relatorio.pdf';

    service.findById.mockResolvedValue({
      id: relatorioId,
      status: 'GERADO',
      arquivoUrl,
    });

    const controller = new RelatoriosController(
      service as any,
      createProducer() as any,
      createPdfGenerator() as any,
      createCloudinaryService() as any,
    );

    const resposta = await controller.buscarPdf(relatorioId);

    expect(resposta).toEqual({
      id: relatorioId,
      url: arquivoUrl,
    });

    expect(service.findById).toHaveBeenCalledWith(relatorioId);
  });

  it('deve rejeitar PDF inexistente', async () => {
    const service = createService();

    const relatorioId =
      'f2b25226-6efc-4cc9-82cf-b0ca79d79b8f';

    service.findById.mockResolvedValue({
      id: relatorioId,
      status: 'PENDENTE',
      arquivoUrl: null,
    });

    const controller = new RelatoriosController(
      service as any,
      createProducer() as any,
      createPdfGenerator() as any,
      createCloudinaryService() as any,
    );

    await expect(
      controller.buscarPdf(relatorioId),
    ).rejects.toThrow(
      'O relatório ainda não possui um PDF gerado',
    );
  });

  it('deve excluir um relatório pelo ID', async () => {
    const service = createService();

    const relatorioId =
      'f2b25226-6efc-4cc9-82cf-b0ca79d79b8f';

    const respostaEsperada = {
      mensagem: 'Relatório excluído com sucesso',
      id: relatorioId,
    };

    service.delete.mockResolvedValue(respostaEsperada);

    const controller = new RelatoriosController(
      service as any,
      createProducer() as any,
      createPdfGenerator() as any,
      createCloudinaryService() as any,
    );

    const resposta =
      await controller.excluirRelatorio(relatorioId);

    expect(resposta).toEqual(respostaEsperada);
    expect(service.delete).toHaveBeenCalledWith(relatorioId);
  });

  it('deve rejeitar ID inválido ao excluir relatório', async () => {
    const service = createService();
    const pipe = new ParseUUIDPipe();

    await expect(
      pipe.transform(''),
    ).rejects.toThrow(BadRequestException);

    expect(service.delete).not.toHaveBeenCalled();
  });

  it('deve responder rapidamente após enviar o relatório para a fila', async () => {
    const service = createService();
    const producer = createProducer();

    const relatorioId =
      'f2b25226-6efc-4cc9-82cf-b0ca79d79b8f';

    service.findById.mockResolvedValue({
      id: relatorioId,
      status: 'GERADO',
    });

    service.updateStatus.mockResolvedValue({
      id: relatorioId,
      status: 'PENDENTE',
    });

    const controller = new RelatoriosController(
      service as any,
      producer as any,
      createPdfGenerator() as any,
      createCloudinaryService() as any,
    );

    const inicio = Date.now();

    const resposta = await controller.gerarRelatorio({
      relatorioId,
    });

    const duracao = Date.now() - inicio;

    expect(producer.adicionarGeracao).toHaveBeenCalledWith(
      relatorioId,
    );

    expect(resposta.status).toBe('PENDENTE');
    expect(duracao).toBeLessThan(1000);
  });

  it('envia o PDF diretamente com os headers de preview', async () => {
    const pdf = Buffer.from('%PDF-test');

    const pdfGeneratorService = {
      gerar: vi.fn().mockResolvedValue(pdf),
    };

    const response = {
      set: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };

    const dto = {
      titulo: 'Relatório financeiro',
      nomeCliente: 'Cliente de teste',
      itens: [
        {
          descricao: 'Honorários',
          valor: 500,
          status: 'Pago',
        },
      ],
    };

    const controller = new RelatoriosController(
      createService() as any,
      createProducer() as any,
      pdfGeneratorService as any,
      createCloudinaryService() as any,
    );

    await controller.preview(dto as any, response as any);

    expect(pdfGeneratorService.gerar).toHaveBeenCalledWith(dto);

    expect(response.set).toHaveBeenCalledWith({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline',
      'Content-Length': String(pdf.length),
    });

    expect(response.send).toHaveBeenCalledWith(pdf);
  });

  it('propaga o erro do gerador para o tratamento padrão do Nest', async () => {
    const error = new Error('Falha ao gerar PDF');

    const pdfGeneratorService = {
      gerar: vi.fn().mockRejectedValue(error),
    };

    const response = {
      set: vi.fn(),
      send: vi.fn(),
    };

    const controller = new RelatoriosController(
      createService() as any,
      createProducer() as any,
      pdfGeneratorService as any,
      createCloudinaryService() as any,
    );

    await expect(
      controller.preview({} as any, response as any),
    ).rejects.toThrow(error);

    expect(response.send).not.toHaveBeenCalled();
  });

  it('deve retornar o PDF quando o relatório estiver GERADO', async () => {
    const service = createService();
    const cloudinaryService = createCloudinaryService();

    const relatorioId =
      'f2b25226-6efc-4cc9-82cf-b0ca79d79b8f';

    const arquivoUrl =
      'https://res.cloudinary.com/teste/raw/upload/relatorios/relatorio.pdf';

    const pdf = Buffer.from('%PDF-test');

    service.findById.mockResolvedValue({
      id: relatorioId,
      status: 'GERADO',
      arquivoUrl,
    });

    cloudinaryService.downloadPdf.mockResolvedValue(pdf);

    const response = {
      set: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };

    const controller = new RelatoriosController(
      service as any,
      createProducer() as any,
      createPdfGenerator() as any,
      cloudinaryService as any,
    );

    await controller.previewRelatorio(
      relatorioId,
      response as any,
    );

    expect(service.findById).toHaveBeenCalledWith(relatorioId);

    expect(
      cloudinaryService.downloadPdf,
    ).toHaveBeenCalledWith(arquivoUrl);

    expect(response.set).toHaveBeenCalledWith({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline',
      'Content-Length': String(pdf.length),
    });

    expect(response.send).toHaveBeenCalledWith(pdf);
  });

  it('deve rejeitar pré-visualização de relatório PENDENTE', async () => {
    const service = createService();

    const relatorioId =
      'f2b25226-6efc-4cc9-82cf-b0ca79d79b8f';

    service.findById.mockResolvedValue({
      id: relatorioId,
      status: 'PENDENTE',
      arquivoUrl: null,
    });

    const cloudinaryService = createCloudinaryService();

    const controller = new RelatoriosController(
      service as any,
      createProducer() as any,
      createPdfGenerator() as any,
      cloudinaryService as any,
    );

    await expect(
      controller.previewRelatorio(
        relatorioId,
        {} as any,
      ),
    ).rejects.toThrow(
      'O PDF do relatório ainda está sendo gerado',
    );

    expect(
      cloudinaryService.downloadPdf,
    ).not.toHaveBeenCalled();
  });

  it('deve rejeitar pré-visualização de relatório com FALHA', async () => {
    const service = createService();

    const relatorioId =
      'f2b25226-6efc-4cc9-82cf-b0ca79d79b8f';

    service.findById.mockResolvedValue({
      id: relatorioId,
      status: 'FALHA',
      arquivoUrl: null,
    });

    const cloudinaryService = createCloudinaryService();

    const controller = new RelatoriosController(
      service as any,
      createProducer() as any,
      createPdfGenerator() as any,
      cloudinaryService as any,
    );

    await expect(
      controller.previewRelatorio(
        relatorioId,
        {} as any,
      ),
    ).rejects.toThrow(
      'A geração do PDF do relatório falhou',
    );

    expect(
      cloudinaryService.downloadPdf,
    ).not.toHaveBeenCalled();
  });

  it('deve rejeitar relatório GERADO sem URL do PDF', async () => {
    const service = createService();

    const relatorioId =
      'f2b25226-6efc-4cc9-82cf-b0ca79d79b8f';

    service.findById.mockResolvedValue({
      id: relatorioId,
      status: 'GERADO',
      arquivoUrl: null,
    });

    const cloudinaryService = createCloudinaryService();

    const controller = new RelatoriosController(
      service as any,
      createProducer() as any,
      createPdfGenerator() as any,
      cloudinaryService as any,
    );

    await expect(
      controller.previewRelatorio(
        relatorioId,
        {} as any,
      ),
    ).rejects.toThrow(
      'O relatório está marcado como GERADO, mas não possui um PDF disponível',
    );

    expect(
      cloudinaryService.downloadPdf,
    ).not.toHaveBeenCalled();
  });

  it('deve propagar erro ao baixar PDF do Cloudinary', async () => {
    const service = createService();
    const cloudinaryService = createCloudinaryService();

    const relatorioId =
      'f2b25226-6efc-4cc9-82cf-b0ca79d79b8f';

    const arquivoUrl =
      'https://res.cloudinary.com/teste/raw/upload/relatorios/relatorio.pdf';

    const error = new Error(
      'Falha ao obter PDF do Cloudinary: 404',
    );

    service.findById.mockResolvedValue({
      id: relatorioId,
      status: 'GERADO',
      arquivoUrl,
    });

    cloudinaryService.downloadPdf.mockRejectedValue(error);

    const response = {
      set: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };

    const controller = new RelatoriosController(
      service as any,
      createProducer() as any,
      createPdfGenerator() as any,
      cloudinaryService as any,
    );

    await expect(
      controller.previewRelatorio(
        relatorioId,
        response as any,
      ),
    ).rejects.toThrow(error);

    expect(response.send).not.toHaveBeenCalled();
  });
});