import { RelatoriosWorker } from './relatorios.worker.js';

describe('RelatoriosWorker', () => {
  it('deve gerar o PDF e enviar para o Cloudinary', async () => {
    const gerarPdf = vi.fn().mockResolvedValue(Buffer.from('%PDF-teste'));
    const uploadPdf = vi
      .fn()
      .mockResolvedValue('https://res.cloudinary.com/teste/relatorio.pdf');

    const update = vi.fn().mockResolvedValue({});

    const relatoriosPdfService = {
      gerarPdf,
    };

    const cloudinaryService = {
      uploadPdf,
    };

    const prisma = {
      relatorio: {
        update,
      },
    };

    const worker = new RelatoriosWorker(
      relatoriosPdfService as any,
      cloudinaryService as any,
      prisma as any,
    );

    const job = {
      name: 'gerar-relatorio',
      data: {
        relatorioId: 1,
      },
    } as any;

    await worker.process(job);

    expect(gerarPdf).toHaveBeenCalledTimes(1);
    expect(gerarPdf).toHaveBeenCalledWith(
      expect.stringContaining('ID do relatório: 1'),
    );

    expect(uploadPdf).toHaveBeenCalledTimes(1);
    expect(uploadPdf).toHaveBeenCalledWith(Buffer.from('%PDF-teste'));

    expect(update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        status: 'pendente',
      },
    });

    expect(update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        status: 'gerado',
        urlDocumentoHash:
          'https://res.cloudinary.com/teste/relatorio.pdf',
        dataGeracao: expect.any(Date),
      },
    });
  });

  it('deve propagar o erro quando a geração do PDF falhar', async () => {
    const erro = new Error('Falha ao gerar PDF');

    const gerarPdf = vi.fn().mockRejectedValue(erro);
    const uploadPdf = vi.fn();

    const update = vi.fn().mockResolvedValue({});

    const relatoriosPdfService = { gerarPdf };
    const cloudinaryService = { uploadPdf };
    const prisma = {
      relatorio: {
        update,
      },
    };

    const worker = new RelatoriosWorker(
      relatoriosPdfService as any,
      cloudinaryService as any,
      prisma as any,
    );

    const job = {
      name: 'gerar-relatorio',
      data: { relatorioId: 1 },
    } as any;

    await expect(worker.process(job)).rejects.toThrow(
      'Falha ao gerar PDF',
    );

    expect(gerarPdf).toHaveBeenCalledTimes(1);
    expect(uploadPdf).not.toHaveBeenCalled();

    expect(update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        status: 'falha',
      },
    });
  });

  it('deve propagar o erro quando o upload para o Cloudinary falhar', async () => {
    const erro = new Error('Falha no upload');

    const gerarPdf = vi.fn().mockResolvedValue(
      Buffer.from('%PDF-teste'),
    );

    const uploadPdf = vi.fn().mockRejectedValue(erro);

    const update = vi.fn().mockResolvedValue({});

    const relatoriosPdfService = { gerarPdf };
    const cloudinaryService = { uploadPdf };
    const prisma = {
      relatorio: {
        update,
      },
    };

    const worker = new RelatoriosWorker(
      relatoriosPdfService as any,
      cloudinaryService as any,
      prisma as any,
    );

    const job = {
      name: 'gerar-relatorio',
      data: { relatorioId: 1 },
    } as any;

    await expect(worker.process(job)).rejects.toThrow(
      'Falha no upload',
    );

    expect(gerarPdf).toHaveBeenCalledTimes(1);
    expect(uploadPdf).toHaveBeenCalledWith(
      Buffer.from('%PDF-teste'),
    );

    expect(update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        status: 'falha',
      },
    });
  });
});