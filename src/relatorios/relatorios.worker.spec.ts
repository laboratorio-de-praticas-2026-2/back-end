import { RelatoriosWorker } from './relatorios.worker.js';

describe('RelatoriosWorker', () => {
  it('deve gerar o PDF e enviar para o Cloudinary', async () => {
    const gerarPdf = vi.fn().mockResolvedValue(Buffer.from('%PDF-teste'));
    const uploadPdf = vi
      .fn()
      .mockResolvedValue('https://res.cloudinary.com/teste/relatorio.pdf');

    const relatoriosPdfService = {
      gerarPdf,
    };

    const cloudinaryService = {
      uploadPdf,
    };

    const worker = new RelatoriosWorker(
      relatoriosPdfService as any,
      cloudinaryService as any,
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
  });
});