import { RelatoriosPdfService } from './relatorios.pdf.service.js';

describe('RelatoriosPdfService', () => {
  it('deve gerar um PDF em memória', async () => {
    const service = new RelatoriosPdfService();

    const html = `
      <html>
        <body>
          <h1>Relatório de teste</h1>
          <p>PDF gerado pelo Puppeteer.</p>
        </body>
      </html>
    `;

    const pdf = await service.gerarPdf(html);

    expect(Buffer.isBuffer(pdf)).toBe(true);
    expect(pdf.length).toBeGreaterThan(0);
    expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
  }, 30000);
});