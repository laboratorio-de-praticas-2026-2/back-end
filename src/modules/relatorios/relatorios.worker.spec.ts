import { describe, expect, it, vi } from 'vitest';
import { RelatoriosWorker } from './relatorios.worker.js';
import { RelatorioTemplateService } from './relatorio-template.service.js';

const ID = 'f2b25226-6efc-4cc9-82cf-b0ca79d79b8f';

function setup() {
  const relatorio = {
    id: ID,
    nome: 'Relatório de DAS',
    categoria: 'Obrigações Fiscais',
    descricao: 'Resumo das obrigações do DAS',
    dataInicio: new Date('2026-04-07T00:00:00Z'),
    dataTermino: new Date('2026-05-07T00:00:00Z'),
  };
  const relatoriosService = {
    findOne: vi.fn().mockResolvedValue(relatorio),
    markGenerated: vi.fn().mockResolvedValue(undefined),
    markFailed: vi.fn().mockResolvedValue(undefined),
  };
  const pdfService = { gerarPdf: vi.fn().mockResolvedValue(Buffer.from('%PDF')) };
  const cloudinary = {
    uploadPdf: vi.fn().mockResolvedValue('https://res.cloudinary.com/x/raw/upload/a.pdf'),
  };
  const worker = new RelatoriosWorker(
    pdfService as any,
    new RelatorioTemplateService(),
    cloudinary as any,
    relatoriosService as any,
  );

  return { worker, relatoriosService, pdfService, cloudinary };
}

const job = { id: '1', name: 'gerar-relatorio', data: { relatorioId: ID } } as any;

describe('RelatoriosWorker', () => {
  it('gera o PDF com os dados reais do relatório, envia e marca como GERADO', async () => {
    const { worker, relatoriosService, pdfService, cloudinary } = setup();

    await worker.process(job);

    const html = pdfService.gerarPdf.mock.calls[0][0] as string;
    expect(html).toContain('Relatório de DAS');
    expect(html).toContain('Obrigações Fiscais');
    expect(html).toContain('Resumo das obrigações do DAS');
    expect(html).toContain('07/04/2026 a 07/05/2026');
    expect(html).not.toContain('Relatório de teste');
    expect(cloudinary.uploadPdf).toHaveBeenCalledWith(Buffer.from('%PDF'));
    expect(relatoriosService.markGenerated).toHaveBeenCalledWith(
      ID,
      'https://res.cloudinary.com/x/raw/upload/a.pdf',
    );
    expect(relatoriosService.markFailed).not.toHaveBeenCalled();
  });

  it('marca FALHA e relança o erro quando a geração do PDF falha', async () => {
    const { worker, relatoriosService, pdfService, cloudinary } = setup();
    pdfService.gerarPdf.mockRejectedValue(new Error('chromium indisponível'));

    await expect(worker.process(job)).rejects.toThrow('chromium indisponível');

    expect(cloudinary.uploadPdf).not.toHaveBeenCalled();
    expect(relatoriosService.markGenerated).not.toHaveBeenCalled();
    expect(relatoriosService.markFailed).toHaveBeenCalledWith(ID);
  });

  it('marca FALHA e não considera GERADO quando o upload falha', async () => {
    const { worker, relatoriosService, cloudinary } = setup();
    cloudinary.uploadPdf.mockRejectedValue(new Error('cloudinary fora'));

    await expect(worker.process(job)).rejects.toThrow('cloudinary fora');

    expect(relatoriosService.markGenerated).not.toHaveBeenCalled();
    expect(relatoriosService.markFailed).toHaveBeenCalledWith(ID);
  });

  it('mantém o erro original mesmo se atualizar o status para FALHA também falhar', async () => {
    const { worker, relatoriosService, pdfService } = setup();
    pdfService.gerarPdf.mockRejectedValue(new Error('erro original'));
    relatoriosService.markFailed.mockRejectedValue(new Error('db fora'));

    await expect(worker.process(job)).rejects.toThrow('erro original');
  });
});
