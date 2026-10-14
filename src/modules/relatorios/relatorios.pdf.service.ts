import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer';

@Injectable()
export class RelatoriosPdfService {
  async gerarPdf(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
      ],
    });

    try {
      const page = await browser.newPage();

      await page.setContent(html, {
        waitUntil: 'load',
      });

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
      });

      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }
}
