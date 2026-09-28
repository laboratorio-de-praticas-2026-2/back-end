import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SequelizeModule } from '@nestjs/sequelize';

import { Report } from '../../models/report.model.js';

import { RelatoriosProducer } from './relatorios.producer.js';
import { RelatoriosWorker } from './relatorios.worker.js';
import { RelatoriosPdfService } from './relatorios.pdf.service.js';
import { RelatoriosController } from './relatorios.controller.js';
import { RelatoriosService } from './relatorios.service.js';

import { CloudinaryModule } from '../../cloudinary/cloudinary.module.js';

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
    RelatoriosService,
  ],
  exports: [RelatoriosProducer],
})
export class RelatoriosModule {}