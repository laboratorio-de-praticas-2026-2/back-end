
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
      // 1. Buscar o relatório no banco de dados
      const relatorio = await this.reportModel.findByPk(relatorioId);

      if (!relatorio) {
        throw new Error('Relatório não encontrado');
      }

      // 2. Atualizar o status para PENDENTE
      await relatorio.update({
        status: 'PENDENTE',
      });

      // 3. Gerar o HTML utilizando o template original
      // do Grupo Bortone, com capa e identidade visual.
      const html = this.relatorioTemplateService.renderRelatorio({
        nome: relatorio.nome,
        categoria: relatorio.categoria,
        descricao: relatorio.descricao,
        dataInicio: relatorio.dataInicio,
        dataTermino: relatorio.dataTermino,
      });

      // 4. Converter o HTML em PDF com Puppeteer
      const pdf = await this.relatoriosPdfService.gerarPdf(html);

      console.log(
        'PDF gerado em memória:',
        pdf.length,
        'bytes',
      );

      // 5. Validar se o PDF foi gerado corretamente
      if (!pdf || pdf.length === 0) {
        throw new Error('PDF gerado está vazio');
      }

      if (!pdf.subarray(0, 4).toString().startsWith('%PDF')) {
        throw new Error('O conteúdo gerado não é um PDF válido');
      }

      // 6. Enviar o PDF para o Cloudinary
      arquivoUrl = await this.cloudinaryService.uploadPdf(pdf);

      console.log(
        'PDF enviado para o Cloudinary:',
        arquivoUrl,
      );

      // 7. Atualizar o relatório com a URL e o status GERADO
      await relatorio.update({
        status: 'GERADO',
        arquivoUrl,
      });

      console.log(
        'Relatório finalizado com sucesso:',
        relatorio.id,
      );
    } catch (error) {
      console.error(
        'Erro ao processar relatório:',
        error instanceof Error ? error.message : error,
      );

      // 8. Remover o arquivo do Cloudinary caso ocorra
      // uma falha após o upload.
      if (arquivoUrl) {
        try {
          const url = new URL(arquivoUrl);

          const partes = url.pathname
            .split('/')
            .filter(Boolean);

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

      // 9. Atualizar o status para FALHA
      try {
        const relatorio = await this.reportModel.findByPk(
          relatorioId,
        );

        if (relatorio) {
          await relatorio.update({
            status: 'FALHA',
          });
        }
      } catch (updateError) {
        console.error(
          'Erro ao atualizar status para falha:',
          updateError instanceof Error
            ? updateError.message
            : updateError,
        );
      }

      // 10. Propagar o erro para o BullMQ
      throw error;
    }
  }
}
