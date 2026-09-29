import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer';
import { RelatorioPdfDto } from './dto/relatorio-pdf.dto.js';
import { RelatorioTemplateService } from './relatorio-template.service.js';

@Injectable()
export class PdfGeneratorService {
  constructor(private readonly templateService: RelatorioTemplateService) {}

  async gerar(dto: RelatorioPdfDto): Promise<Buffer> {
    let browser: Awaited<ReturnType<typeof puppeteer.launch>> | undefined;

    try {
      browser = await puppeteer.launch({
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-gpu',
          '--disable-dev-shm-usage',
        ],
        pipe: true,
      });
      const page = await browser.newPage();
      await page.setContent(this.templateService.render(dto), { waitUntil: 'domcontentloaded' });
      return Buffer.from(await page.pdf({ format: 'A4', printBackground: true }));
    } finally {
      await browser?.close();
    }
  }

}