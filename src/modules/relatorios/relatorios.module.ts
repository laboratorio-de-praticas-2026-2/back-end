import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { RelatoriosProducer } from './relatorios.producer.js';
import { RelatoriosWorker } from './relatorios.worker.js';
import { RelatoriosPdfService } from './relatorios.pdf.service.js';
import { RelatoriosController } from './relatorios.controller.js';
import { CloudinaryModule } from '../cloudinary/cloudinary.module.js';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'relatorios' }),
    CloudinaryModule,
  ],
  controllers: [RelatoriosController],
  providers: [
    RelatoriosProducer,
    RelatoriosWorker,
    RelatoriosPdfService,
  ],
  exports: [RelatoriosProducer],
})
export class RelatoriosModule {}