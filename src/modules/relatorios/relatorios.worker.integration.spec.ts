import { RelatoriosWorker } from './relatorios.worker.js';

describe('RelatoriosWorker - integração', () => {
  it('deve processar o relatório, gerar o PDF e enviar para o Cloudinary', async () => {
    const gerarPdf = vi.fn().mockResolvedValue(
      Buffer.from('%PDF-relatorio-teste'),
    );

    const uploadPdf = vi.fn().mockResolvedValue(
      'https://res.cloudinary.com/teste/raw/upload/relatorio.pdf',
    );

    const relatorioUpdate = vi.fn().mockResolvedValue({});

    const relatoriosPdfService = {
      gerarPdf,
    };

    const cloudinaryService = {
      uploadPdf,
    };

    const prisma = {
      relatorio: {
        update: relatorioUpdate,
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
        relatorioId: 10,
      },
    } as any;

    await worker.process(job);

    expect(relatorioUpdate).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { status: 'pendente' },
    });

    expect(gerarPdf).toHaveBeenCalledTimes(1);

    expect(gerarPdf).toHaveBeenCalledWith(
      expect.stringContaining('ID do relatório: 10'),
    );

    expect(uploadPdf).toHaveBeenCalledTimes(1);

    expect(uploadPdf).toHaveBeenCalledWith(
      Buffer.from('%PDF-relatorio-teste'),
    );

    expect(relatorioUpdate).toHaveBeenLastCalledWith({
      where: { id: 10 },
      data: {
        status: 'gerado',
        urlDocumentoHash:
          'https://res.cloudinary.com/teste/raw/upload/relatorio.pdf',
        dataGeracao: expect.any(Date),
      },
    });
  });
});