import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SequelizeModule } from '@nestjs/sequelize';

import { Report } from '../../models/report.model.js';
import { CloudinaryModule } from '../../cloudinary/cloudinary.module.js';

import { RelatoriosController } from './relatorios.controller.js';
import { RelatoriosProducer } from './relatorios.producer.js';
import { RelatoriosWorker } from './relatorios.worker.js';
import { RelatoriosPdfService } from './relatorios.pdf.service.js';
import { PdfGeneratorService } from './pdf-generator.service.js';
import { RelatorioTemplateService } from './relatorio-template.service.js';
import { RelatoriosService } from './relatorios.service.js';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'relatorios' }),
    CloudinaryModule,
    SequelizeModule.forFeature([Report]),
  ],
  controllers: [RelatoriosController],
  providers: [
    RelatoriosProducer,
    RelatoriosWorker,
    RelatoriosPdfService,
    PdfGeneratorService,
    RelatorioTemplateService,
    RelatoriosService,
  ],
  exports: [
    RelatoriosProducer,
    RelatoriosService,
    PdfGeneratorService,
    RelatorioTemplateService,
  ],
})
export class RelatoriosModule {}