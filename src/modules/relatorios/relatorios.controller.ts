import { Body, Controller, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { RelatorioPdfDto } from './dto/relatorio-pdf.dto.js';
import { PdfGeneratorService } from './pdf-generator.service.js';
import { SimulacaoDto } from './dto/simulacao.dto.js';
import { RelatoriosService } from './relatorios.service.js';

@Controller('relatorios')
export class RelatoriosController {
  constructor(
    private readonly relatoriosService: RelatoriosService,
    private readonly pdfGeneratorService: PdfGeneratorService,
  ) {}

  @Post('simulacao')
  simular(@Body() dto: SimulacaoDto) {
    return this.relatoriosService.simular(dto);
  }

  @Post('preview')
  async preview(@Body() dto: RelatorioPdfDto, @Res() response: Response): Promise<void> {
    const pdf = await this.pdfGeneratorService.gerar(dto);
    response
      .set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
        'Content-Length': String(pdf.length),
      })
      .send(pdf);
  }
}