import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';

import { CreateReportDto } from './dto/create-report.dto.js';
import { FindReportsDto } from './dto/find-reports.dto.js';
import { GenerateReportDto } from './dto/generate-report.dto.js';
import { RelatorioPdfDto } from './dto/relatorio-pdf.dto.js';
import { SimulacaoDto } from './dto/simulacao.dto.js';

import { RelatoriosService } from './relatorios.service.js';
import { RelatoriosProducer } from './relatorios.producer.js';
import { PdfGeneratorService } from './pdf-generator.service.js';

@Controller('relatorios')
export class RelatoriosController {
  constructor(
    private readonly relatoriosService: RelatoriosService,
    private readonly relatoriosProducer: RelatoriosProducer,
    private readonly pdfGeneratorService: PdfGeneratorService,
  ) {}

  @Post('simulacao')
  simular(@Body() dto: SimulacaoDto) {
    return this.relatoriosService.simular(dto);
  }

  @Post('preview')
  async preview(
    @Body() dto: RelatorioPdfDto,
    @Res() response: Response,
  ): Promise<void> {
    const pdf = await this.pdfGeneratorService.gerar(dto);

    response
      .set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
        'Content-Length': String(pdf.length),
      })
      .send(pdf);
  }

  @Post()
  async create(@Body() data: CreateReportDto) {
    return this.relatoriosService.create(data);
  }

  @Get('categorias')
  async findCategories() {
    return this.relatoriosService.findCategories();
  }

  @Get()
  async findAll(@Query() filters: FindReportsDto) {
    return this.relatoriosService.findAll(filters);
  }

  @Post('generate')
  async gerarRelatorio(@Body() body: GenerateReportDto) {
    await this.relatoriosService.markPending(body.relatorioId);
    await this.relatoriosProducer.adicionarGeracao(body.relatorioId);

    return {
      mensagem: 'Job de geração de relatório enviado para a fila',
      relatorioId: body.relatorioId,
      status: 'PENDENTE',
    };
  }

  @Get(':id')
  async buscarRelatorio(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.relatoriosService.findOne(id);
  }

  @Get(':id/pdf')
  async buscarPdf(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Res() response: Response,
  ): Promise<void> {
    const relatorio = await this.relatoriosService.findPdf(id);
    const pdf = await this.relatoriosService.downloadPdf(relatorio.url);

    response
      .set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="relatorio-${id}.pdf"`,
        'Content-Length': String(pdf.length),
      })
      .send(pdf);
  }

  @Delete(':id')
  async excluirRelatorio(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.relatoriosService.remove(id);
  }
}
