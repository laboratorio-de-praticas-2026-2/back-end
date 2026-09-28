import { Injectable } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { RelatoriosPdfService } from './relatorios.pdf.service.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
@Processor('relatorios')
export class RelatoriosWorker extends WorkerHost {
  constructor(
    private readonly relatoriosPdfService: RelatoriosPdfService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    const relatorioId = job.data.relatorioId;

    console.log('Job recebido:', job.name, job.data);

    try {
      await this.prisma.relatorio.update({
        where: { id: relatorioId },
        data: {
          status: 'pendente',
        },
      });

      const html = `
        <html>
          <body>
            <h1>Relatório de teste</h1>
            <p>ID do relatório: ${relatorioId}</p>
          </body>
        </html>
      `;

      const pdf = await this.relatoriosPdfService.gerarPdf(html);

      console.log('PDF gerado em memória:', pdf.length, 'bytes');

      const url = await this.cloudinaryService.uploadPdf(pdf);

      console.log('PDF enviado para o Cloudinary:', url);

      await this.prisma.relatorio.update({
        where: { id: relatorioId },
        data: {
          status: 'gerado',
          urlDocumentoHash: url,
          dataGeracao: new Date(),
        },
      });
    } catch (error) {
      console.error(
        'Erro ao processar relatório:',
        error instanceof Error ? error.message : error,
      );

      try {
        await this.prisma.relatorio.update({
          where: { id: relatorioId },
          data: {
            status: 'falha',
          },
        });
      } catch (updateError) {
        console.error(
          'Erro ao atualizar status para falha:',
          updateError instanceof Error ? updateError.message : updateError,
        );
      }

      throw error;
    }
  }
}