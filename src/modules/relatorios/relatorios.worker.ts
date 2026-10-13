import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { RelatoriosPdfService } from './relatorios.pdf.service.js';
import { RelatorioTemplateService } from './relatorio-template.service.js';
import { RelatoriosService } from './relatorios.service.js';
import { CloudinaryService } from '../../cloudinary/cloudinary.service.js';

@Injectable()
@Processor('relatorios')
export class RelatoriosWorker extends WorkerHost {
  private readonly logger = new Logger(RelatoriosWorker.name);

  constructor(
    private readonly relatoriosPdfService: RelatoriosPdfService,
    private readonly templateService: RelatorioTemplateService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly relatoriosService: RelatoriosService,
  ) {
    super();
  }

  async process(job: Job<{ relatorioId: string }>): Promise<void> {
    const { relatorioId } = job.data;

    this.logger.log(`Gerando relatório ${relatorioId} (job ${job.id})`);

    try {
      const relatorio = await this.relatoriosService.findOne(relatorioId);

      const html = this.templateService.renderRelatorio({
        nome: relatorio.nome,
        categoria: relatorio.categoria,
        descricao: relatorio.descricao,
        dataInicio: relatorio.dataInicio,
        dataTermino: relatorio.dataTermino,
      });

      const pdf = await this.relatoriosPdfService.gerarPdf(html);
      const url = await this.cloudinaryService.uploadPdf(pdf);

      // O relatório só passa a GERADO depois que o PDF foi gerado e armazenado.
      await this.relatoriosService.markGenerated(relatorioId, url);

      this.logger.log(`Relatório ${relatorioId} gerado (${pdf.length} bytes)`);
    } catch (error) {
      this.logger.error(
        `Falha ao gerar relatório ${relatorioId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error.stack : undefined,
      );

      try {
        await this.relatoriosService.markFailed(relatorioId);
      } catch (updateError) {
        this.logger.error(
          `Erro ao atualizar status para FALHA: ${
            updateError instanceof Error ? updateError.message : updateError
          }`,
        );
      }

      throw error;
    }
  }
}
