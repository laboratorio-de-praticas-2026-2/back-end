import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PdfGeneratorService } from './pdf-generator.service.js';
import { RelatorioTemplateService } from './relatorio-template.service.js';

const puppeteerMock = vi.hoisted(() => ({
  launch: vi.fn(),
}));

vi.mock('puppeteer', () => ({ default: puppeteerMock }));

const dto = {
  titulo: 'Relatório financeiro',
  nomeCliente: 'Cliente de teste',
  itens: [{ descricao: 'Honorários', valor: 500, status: 'Pago' }],
};

describe('PdfGeneratorService', () => {
  const page = {
    setContent: vi.fn(),
    pdf: vi.fn(),
  };
  const browser = {
    newPage: vi.fn(),
    close: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    page.setContent.mockResolvedValue(undefined);
    page.pdf.mockResolvedValue(Uint8Array.from([37, 80, 68, 70]));
    browser.newPage.mockResolvedValue(page);
    browser.close.mockResolvedValue(undefined);
    puppeteerMock.launch.mockResolvedValue(browser);
  });

  it('gera um Buffer em formato A4 e fecha o navegador', async () => {
    const result = await new PdfGeneratorService(new RelatorioTemplateService()).gerar(dto);

    expect(Buffer.isBuffer(result)).toBe(true);
    expect(puppeteerMock.launch).toHaveBeenCalledWith({
      headless: true,
      executablePath: undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
      ],
      pipe: true,
    });
    expect(page.setContent).toHaveBeenCalledWith(
      expect.stringContaining('Relatório financeiro'),
      { waitUntil: 'domcontentloaded' },
    );
    expect(page.setContent).toHaveBeenCalledWith(
      expect.stringContaining('Honorários'),
      { waitUntil: 'domcontentloaded' },
    );
    expect(page.pdf).toHaveBeenCalledWith({ format: 'A4', printBackground: true });
    expect(browser.close).toHaveBeenCalledOnce();
  });

  it('fecha o navegador quando a geração falha', async () => {
    const error = new Error('Falha ao gerar PDF');
    page.pdf.mockRejectedValue(error);

    await expect(new PdfGeneratorService(new RelatorioTemplateService()).gerar(dto)).rejects.toThrow(error);
    expect(browser.close).toHaveBeenCalledOnce();
  });
});