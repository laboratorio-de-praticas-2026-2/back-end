import { Module } from '@nestjs/common';
import { RelatoriosController } from './relatorios.controller.js';
import { PdfGeneratorService } from './pdf-generator.service.js';
import { RelatorioTemplateService } from './relatorio-template.service.js';
import { RelatoriosService } from './relatorios.service.js';

@Module({
  controllers: [RelatoriosController],
  providers: [RelatoriosService, PdfGeneratorService, RelatorioTemplateService],
  exports: [RelatoriosService, PdfGeneratorService, RelatorioTemplateService],
})
export class RelatoriosModule {}