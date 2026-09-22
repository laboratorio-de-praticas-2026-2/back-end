import { RelatoriosWorker } from './relatorios.worker.js';

describe('RelatoriosWorker - integração', () => {
  it('deve processar o relatório, gerar o PDF e enviar para o Cloudinary', async () => {
    const gerarPdf = vi.fn().mockResolvedValue(
      Buffer.from('%PDF-relatorio-teste'),
    );

    const uploadPdf = vi.fn().mockResolvedValue(
      'https://res.cloudinary.com/teste/raw/upload/relatorio.pdf',
    );

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
        relatorioId: 10,
      },
    } as any;

    await worker.process(job);

    expect(gerarPdf).toHaveBeenCalledTimes(1);

    expect(gerarPdf).toHaveBeenCalledWith(
      expect.stringContaining('ID do relatório: 10'),
    );

    expect(uploadPdf).toHaveBeenCalledTimes(1);

    expect(uploadPdf).toHaveBeenCalledWith(
      Buffer.from('%PDF-relatorio-teste'),
    );

    const urlRetornada = await uploadPdf.mock.results[0].value;

    expect(urlRetornada).toBe(
      'https://res.cloudinary.com/teste/raw/upload/relatorio.pdf',
    );
  });
});