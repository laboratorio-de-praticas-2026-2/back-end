import { RelatoriosWorker } from './relatorios.worker.js';

describe('RelatoriosWorker - integração', () => {
  it('deve processar o relatório, gerar o PDF e enviar para o Cloudinary', async () => {
    const relatorioId = '10';
    const urlPdf =
      'https://res.cloudinary.com/teste/raw/upload/relatorio.pdf';
    const pdf = Buffer.from('%PDF-relatorio-teste');

    const gerarPdf = vi.fn().mockResolvedValue(pdf);
    const uploadPdf = vi.fn().mockResolvedValue(urlPdf);

    const relatorio = {
      id: relatorioId,
      nome: 'Relatório de teste',
      categoria: 'Financeiro',
      descricao: 'Relatório para teste',
      dataInicio: new Date('2026-01-01T00:00:00.000Z'),
      dataTermino: new Date('2026-01-31T00:00:00.000Z'),
    };

    const findOne = vi.fn().mockResolvedValue(relatorio);
    const markGenerated = vi.fn().mockResolvedValue(undefined);
    const markFailed = vi.fn().mockResolvedValue(undefined);

    const renderRelatorio = vi.fn().mockReturnValue(
      '<html><body>Relatório de teste</body></html>',
    );

    const relatoriosPdfService = { gerarPdf };
    const templateService = { renderRelatorio };
    const cloudinaryService = { uploadPdf };
    const relatoriosService = {
      findOne,
      markGenerated,
      markFailed,
    };

    const worker = new RelatoriosWorker(
      relatoriosPdfService as any,
      templateService as any,
      cloudinaryService as any,
      relatoriosService as any,
    );

    const job = {
      id: 'job-10',
      name: 'gerar-relatorio',
      data: { relatorioId },
    } as any;

    await worker.process(job);

    expect(findOne).toHaveBeenCalledWith(relatorioId);

    expect(renderRelatorio).toHaveBeenCalledWith({
      nome: relatorio.nome,
      categoria: relatorio.categoria,
      descricao: relatorio.descricao,
      dataInicio: relatorio.dataInicio,
      dataTermino: relatorio.dataTermino,
    });

    expect(gerarPdf).toHaveBeenCalledWith(
      '<html><body>Relatório de teste</body></html>',
    );

    expect(uploadPdf).toHaveBeenCalledWith(pdf);

    expect(markGenerated).toHaveBeenCalledWith(relatorioId, urlPdf);
    expect(markFailed).not.toHaveBeenCalled();
  });
});