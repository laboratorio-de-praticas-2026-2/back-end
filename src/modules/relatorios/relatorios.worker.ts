import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

import { Report } from '../../models/report.model.js';
import { RelatoriosPdfService } from './relatorios.pdf.service.js';
import { RelatorioTemplateService } from './relatorio-template.service.js';
import { CloudinaryService } from '../../cloudinary/cloudinary.service.js';

@Injectable()
@Processor('relatorios')
export class RelatoriosWorker extends WorkerHost {
  constructor(
    private readonly relatoriosPdfService: RelatoriosPdfService,
    private readonly relatorioTemplateService: RelatorioTemplateService,
    private readonly cloudinaryService: CloudinaryService,
    @InjectModel(Report)
    private readonly reportModel: typeof Report,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    const relatorioId = job.data.relatorioId as string;

    console.log('Job recebido:', job.name, job.data);

    let arquivoUrl: string | null = null;

    try {
      const relatorio = await this.reportModel.findByPk(relatorioId);

      if (!relatorio) {
        throw new Error('Relatório não encontrado');
      }

      await relatorio.update({
        status: 'PENDENTE',
      });

      const dto = {
        titulo: relatorio.nome,
        nomeCliente: relatorio.categoria,
        periodoInicio: relatorio.dataInicio.toISOString(),
        periodoFim: relatorio.dataTermino.toISOString(),
        itens: [
          {
            descricao: relatorio.descricao,
            valor: 0,
            status: relatorio.status,
          },
        ],
      };

      const html = this.relatorioTemplateService.render(dto);

      const pdf = await this.relatoriosPdfService.gerarPdf(html);

      console.log('PDF gerado em memória:', pdf.length, 'bytes');

      if (!pdf || pdf.length === 0) {
        throw new Error('PDF gerado está vazio');
      }

      if (!pdf.subarray(0, 4).toString().startsWith('%PDF')) {
        throw new Error('O conteúdo gerado não é um PDF válido');
      }

      arquivoUrl = await this.cloudinaryService.uploadPdf(pdf);

      console.log('PDF enviado para o Cloudinary:', arquivoUrl);

      await relatorio.update({
        status: 'GERADO',
        arquivoUrl,
      });

      console.log('Relatório finalizado com sucesso:', relatorio.id);
    } catch (error) {
      console.error(
        'Erro ao processar relatório:',
        error instanceof Error ? error.message : error,
      );

      if (arquivoUrl) {
        try {
          const url = new URL(arquivoUrl);
          const partes = url.pathname.split('/').filter(Boolean);
          const uploadIndex = partes.indexOf('upload');

          if (uploadIndex !== -1) {
            const publicId = partes
              .slice(uploadIndex + 1)
              .filter((parte) => !/^v\d+$/.test(parte))
              .join('/');

            await this.cloudinaryService.deletePdf(publicId);
          }
        } catch (cleanupError) {
          console.error(
            'Erro ao remover PDF do Cloudinary após falha:',
            cleanupError instanceof Error
              ? cleanupError.message
              : cleanupError,
          );
        }
      }

      try {
        const relatorio = await this.reportModel.findByPk(relatorioId);

        if (relatorio) {
          await relatorio.update({
            status: 'FALHA',
          });
        }
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