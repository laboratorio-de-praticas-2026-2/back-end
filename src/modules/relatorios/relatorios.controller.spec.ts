import { describe, expect, it, vi } from 'vitest';
import { RelatoriosController } from './relatorios.controller.js';

describe('RelatoriosController', () => {
  const createService = () => ({
    create: vi.fn(),
    findCategories: vi.fn(),
    findAll: vi.fn(),
  });

  it('deve estar definido', () => {
    const service = createService();

    const controller = new RelatoriosController(
      service as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
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
      ...data,
      status: 'PENDENTE',
      arquivoUrl: null,
    };

    service.create.mockResolvedValue(createdReport);

    const controller = new RelatoriosController(
      service as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
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
      {} as any,
      {} as any,
      {} as any,
      {} as any,
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
    };

    service.findAll.mockResolvedValue(response);

    const controller = new RelatoriosController(
      service as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

    const result = await controller.findAll(filters as any);

    expect(result).toEqual(response);
    expect(service.findAll).toHaveBeenCalledWith(filters);
  });

  it('deve colocar o relatório pendente e enviar para a fila', async () => {
    const adicionarGeracao = vi.fn().mockResolvedValue(undefined);

    const findUnique = vi.fn().mockResolvedValue({
      id: 1,
      status: 'gerado',
    });

    const update = vi.fn().mockResolvedValue({
      id: 1,
      status: 'pendente',
    });

    const service = createService();

    const controller = new RelatoriosController(
      service as any,
      {
        adicionarGeracao,
      } as any,
      {
        relatorio: {
          findUnique,
          update,
        },
      } as any,
      {} as any,
      {} as any,
    );

    const resposta = await controller.gerarRelatorio({
      relatorioId: 1,
    });

    expect(findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
    });

    expect(update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        status: 'pendente',
      },
    });

    expect(adicionarGeracao).toHaveBeenCalledWith(1);

    expect(resposta).toEqual({
      mensagem: 'Job de geração de relatório enviado para a fila',
      relatorioId: 1,
      status: 'pendente',
    });
  });

  it('deve rejeitar relatorioId inválido', async () => {
    const adicionarGeracao = vi.fn();
    const service = createService();

    const controller = new RelatoriosController(
      service as any,
      {
        adicionarGeracao,
      } as any,
      {} as any,
      {} as any,
      {} as any,
    );

    await expect(
      controller.gerarRelatorio({ relatorioId: 0 }),
    ).rejects.toThrow(
      'relatorioId deve ser um número inteiro positivo',
    );

    expect(adicionarGeracao).not.toHaveBeenCalled();
  });

  it('deve rejeitar relatório inexistente', async () => {
    const findUnique = vi.fn().mockResolvedValue(null);
    const service = createService();

    const controller = new RelatoriosController(
      service as any,
      {
        adicionarGeracao: vi.fn(),
      } as any,
      {
        relatorio: {
          findUnique,
        },
      } as any,
      {} as any,
      {} as any,
    );

    await expect(
      controller.gerarRelatorio({ relatorioId: 999 }),
    ).rejects.toThrow('Relatório não encontrado');
  });

  it('deve buscar um relatório pelo ID', async () => {
    const relatorio = {
      id: 1,
      nome: 'Relatório teste',
      status: 'gerado',
    };

    const service = createService();

    const controller = new RelatoriosController(
      service as any,
      {
        adicionarGeracao: vi.fn(),
      } as any,
      {
        relatorio: {
          findUnique: vi.fn().mockResolvedValue(relatorio),
        },
      } as any,
      {} as any,
      {} as any,
    );

    const resposta = await controller.buscarRelatorio('1');

    expect(resposta).toEqual(relatorio);
  });

  it('deve buscar o PDF de um relatório pelo ID', async () => {
    const service = createService();

    const controller = new RelatoriosController(
      service as any,
      {
        adicionarGeracao: vi.fn(),
      } as any,
      {
        relatorio: {
          findUnique: vi.fn().mockResolvedValue({
            id: 1,
            urlDocumentoHash:
              'https://res.cloudinary.com/teste/relatorio.pdf',
          }),
        },
      } as any,
      {} as any,
      {} as any,
    );

    const resposta = await controller.buscarPdf('1');

    expect(resposta).toEqual({
      id: 1,
      url: 'https://res.cloudinary.com/teste/relatorio.pdf',
    });
  });

  it('deve rejeitar PDF inexistente', async () => {
    const service = createService();

    const controller = new RelatoriosController(
      service as any,
      {
        adicionarGeracao: vi.fn(),
      } as any,
      {
        relatorio: {
          findUnique: vi.fn().mockResolvedValue({
            id: 1,
            urlDocumentoHash: null,
          }),
        },
      } as any,
      {
        deletePdf: vi.fn(),
      } as any,
      {} as any,
    );

    await expect(
      controller.buscarPdf('1'),
    ).rejects.toThrow('PDF do relatório não encontrado');
  });

  it('deve rejeitar exclusão de relatório inexistente', async () => {
    const service = createService();

    const controller = new RelatoriosController(
      service as any,
      {
        adicionarGeracao: vi.fn(),
      } as any,
      {
        relatorio: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
      } as any,
      {
        deletePdf: vi.fn(),
      } as any,
      {} as any,
    );

    await expect(
      controller.excluirRelatorio('999'),
    ).rejects.toThrow('Relatório não encontrado');
  });

  it('deve excluir um relatório pelo ID e remover o PDF do Cloudinary', async () => {
    const deleteRelatorio = vi.fn().mockResolvedValue({});

    const findUnique = vi.fn().mockResolvedValue({
      id: 1,
      urlDocumentoHash:
        'https://res.cloudinary.com/teste/raw/upload/v123456/relatorios/relatorio.pdf',
    });

    const deletePdf = vi.fn().mockResolvedValue(undefined);
    const service = createService();

    const controller = new RelatoriosController(
      service as any,
      {
        adicionarGeracao: vi.fn(),
      } as any,
      {
        relatorio: {
          findUnique,
          delete: deleteRelatorio,
        },
      } as any,
      {
        deletePdf,
      } as any,
      {} as any,
    );

    const resposta = await controller.excluirRelatorio('1');

    expect(deletePdf).toHaveBeenCalledWith(
      'relatorios/relatorio.pdf',
    );

    expect(deleteRelatorio).toHaveBeenCalledWith({
      where: { id: 1 },
    });

    expect(resposta).toEqual({
      mensagem: 'Relatório excluído com sucesso',
      id: 1,
    });
  });

  it('deve responder rapidamente após enviar o relatório para a fila', async () => {
    const adicionarGeracao = vi.fn().mockResolvedValue(undefined);
    const service = createService();

    const controller = new RelatoriosController(
      service as any,
      {
        adicionarGeracao,
      } as any,
      {
        relatorio: {
          findUnique: vi.fn().mockResolvedValue({
            id: 1,
            status: 'gerado',
          }),
          update: vi.fn().mockResolvedValue({
            id: 1,
            status: 'pendente',
          }),
        },
      } as any,
      {} as any,
      {} as any,
    );

    const inicio = Date.now();

    const resposta = await controller.gerarRelatorio({
      relatorioId: 1,
    });

    const duracao = Date.now() - inicio;

    expect(adicionarGeracao).toHaveBeenCalledWith(1);
    expect(resposta.status).toBe('pendente');
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
      {
        simular: vi.fn(),
      } as any,
      {} as any,
      {} as any,
      {} as any,
      pdfGeneratorService as any,
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
      {
        simular: vi.fn(),
      } as any,
      {} as any,
      {} as any,
      {} as any,
      pdfGeneratorService as any,
    );

    await expect(
      controller.preview({} as any, response as any),
    ).rejects.toThrow(error);

    expect(response.send).not.toHaveBeenCalled();
  });
});