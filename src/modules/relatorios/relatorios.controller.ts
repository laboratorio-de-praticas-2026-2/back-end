import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CreateReportDto } from './dto/create-report.dto.js';
import { FindReportsDto } from './dto/find-reports.dto.js';
import { RelatoriosService } from './relatorios.service.js';

@Controller('relatorios')
export class RelatoriosController {
  constructor(private readonly relatoriosService: RelatoriosService) {}

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
}