import { describe, expect, it, vi } from 'vitest';

import { RelatoriosWorker } from './relatorios.worker.js';

describe('RelatoriosWorker', () => {
  const relatorioId =
    'f2b25226-6efc-4cc9-82cf-b0ca79d79b8f';

  const criarRelatorio = () => {
    const update = vi.fn().mockResolvedValue({});

    return {
      id: relatorioId,
      nome: 'Relatório Financeiro',
      categoria: 'Financeiro',
      descricao: 'Relatório financeiro mensal',
      dataInicio: new Date('2026-09-01'),
      dataTermino: new Date('2026-09-30'),
      status: 'PENDENTE' as const,
      arquivoUrl: null,
      update,
    };
  };

  it('deve gerar o PDF e enviar para o Cloudinary', async () => {
    const relatorio = criarRelatorio();

    const findByPk = vi.fn().mockResolvedValue(relatorio);

    const render = vi
      .fn()
      .mockReturnValue('<html>Relatório teste</html>');

    const gerarPdf = vi
      .fn()
      .mockResolvedValue(Buffer.from('%PDF-teste'));

    const uploadPdf = vi
      .fn()
      .mockResolvedValue(
        'https://res.cloudinary.com/teste/relatorio.pdf',
      );

    const reportModel = {
      findByPk,
    };

    const relatorioTemplateService = {
      render,
    };

    const relatoriosPdfService = {
      gerarPdf,
    };

    const cloudinaryService = {
      uploadPdf,
      deletePdf: vi.fn(),
    };

    const worker = new RelatoriosWorker(
      relatoriosPdfService as any,
      relatorioTemplateService as any,
      cloudinaryService as any,
      reportModel as any,
    );

    const job = {
      name: 'gerar-relatorio',
      data: {
        relatorioId,
      },
    } as any;

    await worker.process(job);

    expect(findByPk).toHaveBeenCalledWith(relatorioId);

    expect(relatorio.update).toHaveBeenCalledWith({
      status: 'PENDENTE',
    });

    expect(render).toHaveBeenCalledTimes(1);

    expect(gerarPdf).toHaveBeenCalledWith(
      '<html>Relatório teste</html>',
    );

    expect(gerarPdf).toHaveBeenCalledTimes(1);

    expect(uploadPdf).toHaveBeenCalledTimes(1);
    expect(uploadPdf).toHaveBeenCalledWith(
      Buffer.from('%PDF-teste'),
    );

    expect(relatorio.update).toHaveBeenCalledWith({
      status: 'GERADO',
      arquivoUrl:
        'https://res.cloudinary.com/teste/relatorio.pdf',
    });
  });

  it('deve marcar o relatório como FALHA quando a geração do PDF falhar', async () => {
    const relatorio = criarRelatorio();

    const findByPk = vi.fn().mockResolvedValue(relatorio);

    const render = vi
      .fn()
      .mockReturnValue('<html>Relatório teste</html>');

    const erro = new Error('Falha ao gerar PDF');

    const gerarPdf = vi.fn().mockRejectedValue(erro);

    const uploadPdf = vi.fn();

    const reportModel = {
      findByPk,
    };

    const relatorioTemplateService = {
      render,
    };

    const relatoriosPdfService = {
      gerarPdf,
    };

    const cloudinaryService = {
      uploadPdf,
      deletePdf: vi.fn(),
    };

    const worker = new RelatoriosWorker(
      relatoriosPdfService as any,
      relatorioTemplateService as any,
      cloudinaryService as any,
      reportModel as any,
    );

    const job = {
      name: 'gerar-relatorio',
      data: {
        relatorioId,
      },
    } as any;

    await expect(worker.process(job)).rejects.toThrow(
      'Falha ao gerar PDF',
    );

    expect(gerarPdf).toHaveBeenCalledTimes(1);
    expect(uploadPdf).not.toHaveBeenCalled();

    expect(relatorio.update).toHaveBeenCalledWith({
      status: 'FALHA',
    });
  });

  it('deve marcar o relatório como FALHA quando o upload para o Cloudinary falhar', async () => {
    const relatorio = criarRelatorio();

    const findByPk = vi.fn().mockResolvedValue(relatorio);

    const render = vi
      .fn()
      .mockReturnValue('<html>Relatório teste</html>');

    const gerarPdf = vi
      .fn()
      .mockResolvedValue(Buffer.from('%PDF-teste'));

    const erro = new Error('Falha no upload');

    const uploadPdf = vi.fn().mockRejectedValue(erro);

    const reportModel = {
      findByPk,
    };

    const relatorioTemplateService = {
      render,
    };

    const relatoriosPdfService = {
      gerarPdf,
    };

    const cloudinaryService = {
      uploadPdf,
      deletePdf: vi.fn(),
    };

    const worker = new RelatoriosWorker(
      relatoriosPdfService as any,
      relatorioTemplateService as any,
      cloudinaryService as any,
      reportModel as any,
    );

    const job = {
      name: 'gerar-relatorio',
      data: {
        relatorioId,
      },
    } as any;

    await expect(worker.process(job)).rejects.toThrow(
      'Falha no upload',
    );

    expect(gerarPdf).toHaveBeenCalledTimes(1);

    expect(uploadPdf).toHaveBeenCalledWith(
      Buffer.from('%PDF-teste'),
    );

    expect(relatorio.update).toHaveBeenCalledWith({
      status: 'FALHA',
    });
  });

  it('deve rejeitar quando o relatório não existir', async () => {
    const findByPk = vi.fn().mockResolvedValue(null);

    const render = vi.fn();
    const gerarPdf = vi.fn();
    const uploadPdf = vi.fn();

    const reportModel = {
      findByPk,
    };

    const relatorioTemplateService = {
      render,
    };

    const relatoriosPdfService = {
      gerarPdf,
    };

    const cloudinaryService = {
      uploadPdf,
      deletePdf: vi.fn(),
    };

    const worker = new RelatoriosWorker(
      relatoriosPdfService as any,
      relatorioTemplateService as any,
      cloudinaryService as any,
      reportModel as any,
    );

    const job = {
      name: 'gerar-relatorio',
      data: {
        relatorioId,
      },
    } as any;

    await expect(worker.process(job)).rejects.toThrow(
      'Relatório não encontrado',
    );

    expect(render).not.toHaveBeenCalled();
    expect(gerarPdf).not.toHaveBeenCalled();
    expect(uploadPdf).not.toHaveBeenCalled();
  });

  it('não deve marcar como GERADO quando o PDF estiver vazio', async () => {
    const relatorio = criarRelatorio();

    const findByPk = vi.fn().mockResolvedValue(relatorio);

    const render = vi
      .fn()
      .mockReturnValue('<html>Relatório teste</html>');

    const gerarPdf = vi
      .fn()
      .mockResolvedValue(Buffer.alloc(0));

    const uploadPdf = vi.fn();

    const reportModel = {
      findByPk,
    };

    const relatorioTemplateService = {
      render,
    };

    const relatoriosPdfService = {
      gerarPdf,
    };

    const cloudinaryService = {
      uploadPdf,
      deletePdf: vi.fn(),
    };

    const worker = new RelatoriosWorker(
      relatoriosPdfService as any,
      relatorioTemplateService as any,
      cloudinaryService as any,
      reportModel as any,
    );

    const job = {
      name: 'gerar-relatorio',
      data: {
        relatorioId,
      },
    } as any;

    await expect(worker.process(job)).rejects.toThrow(
      'PDF gerado está vazio',
    );

    expect(uploadPdf).not.toHaveBeenCalled();

    expect(relatorio.update).toHaveBeenCalledWith({
      status: 'FALHA',
    });
  });

  it('não deve marcar como GERADO quando o conteúdo não for um PDF válido', async () => {
    const relatorio = criarRelatorio();

    const findByPk = vi.fn().mockResolvedValue(relatorio);

    const render = vi
      .fn()
      .mockReturnValue('<html>Relatório teste</html>');

    const gerarPdf = vi
      .fn()
      .mockResolvedValue(Buffer.from('conteudo inválido'));

    const uploadPdf = vi.fn();

    const reportModel = {
      findByPk,
    };

    const relatorioTemplateService = {
      render,
    };

    const relatoriosPdfService = {
      gerarPdf,
    };

    const cloudinaryService = {
      uploadPdf,
      deletePdf: vi.fn(),
    };

    const worker = new RelatoriosWorker(
      relatoriosPdfService as any,
      relatorioTemplateService as any,
      cloudinaryService as any,
      reportModel as any,
    );

    const job = {
      name: 'gerar-relatorio',
      data: {
        relatorioId,
      },
    } as any;

    await expect(worker.process(job)).rejects.toThrow(
      'O conteúdo gerado não é um PDF válido',
    );

    expect(uploadPdf).not.toHaveBeenCalled();

    expect(relatorio.update).toHaveBeenCalledWith({
      status: 'FALHA',
    });
  });
});