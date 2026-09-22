import { Injectable } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { RelatoriosPdfService } from './relatorios.pdf.service.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';

@Injectable()
@Processor('relatorios')
export class RelatoriosWorker extends WorkerHost {
  constructor(
    private readonly relatoriosPdfService: RelatoriosPdfService,
    private readonly cloudinaryService: CloudinaryService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    console.log('Job recebido:', job.name, job.data);

    try {
      const html = `
        <html>
          <body>
            <h1>Relatório de teste</h1>
            <p>ID do relatório: ${job.data.relatorioId}</p>
          </body>
        </html>
      `;

      const pdf = await this.relatoriosPdfService.gerarPdf(html);

      console.log('PDF gerado em memória:', pdf.length, 'bytes');

      const url = await this.cloudinaryService.uploadPdf(pdf);

      console.log('PDF enviado para o Cloudinary:', url);
    } catch (error) {
      console.error(
        'Erro ao processar relatório:',
        error instanceof Error ? error.message : error,
      );

      throw error;
    }
  }
}