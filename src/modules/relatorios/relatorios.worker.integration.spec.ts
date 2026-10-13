import { describe, expect, it, vi } from 'vitest';

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

    const reportModel = {
      findByPk: vi.fn().mockResolvedValue({
        id: 'f2b25226-6efc-4cc9-82cf-b0ca79d79b8f',
        nome: 'Relatório de teste',
        categoria: 'Financeiro',
        descricao: 'Relatório para teste de integração',
        dataInicio: new Date('2026-09-01'),
        dataTermino: new Date('2026-09-30'),
        status: 'PENDENTE',
        arquivoUrl: null,
        update: relatorioUpdate,
      }),
    };

    const relatoriosPdfService = {
      gerarPdf,
    };

    const relatorioTemplateService = {
      render: vi.fn().mockReturnValue('<html>relatório</html>'),
    };

    const cloudinaryService = {
      uploadPdf,
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
        relatorioId: 'f2b25226-6efc-4cc9-82cf-b0ca79d79b8f',
      },
    } as any;

    await worker.process(job);

    expect(reportModel.findByPk).toHaveBeenCalledWith(
      'f2b25226-6efc-4cc9-82cf-b0ca79d79b8f',
    );

    expect(relatorioUpdate).toHaveBeenCalledWith({
      status: 'PENDENTE',
    });

    expect(relatorioTemplateService.render).toHaveBeenCalled();

    expect(gerarPdf).toHaveBeenCalledWith(
      '<html>relatório</html>',
    );

    expect(uploadPdf).toHaveBeenCalledTimes(1);

    expect(uploadPdf).toHaveBeenCalledWith(
      Buffer.from('%PDF-relatorio-teste'),
    );

    expect(relatorioUpdate).toHaveBeenLastCalledWith({
      status: 'GERADO',
      arquivoUrl:
        'https://res.cloudinary.com/teste/raw/upload/relatorio.pdf',
    });
  });
});