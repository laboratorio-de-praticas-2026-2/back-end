import { Controller, Get, Query } from '@nestjs/common';
import { ServicosService } from './servicos.service.js';
import { PeriodFilterDto } from './dto/period-filter.dto.js';

@Controller('dashboard/servicos')
export class ServicosController {
  constructor(private readonly servicosService: ServicosService) {}

  @Get()
  async getIndicadores(@Query() query: PeriodFilterDto) {
    return this.servicosService.getIndicadores(query.startDate, query.endDate);
  }
}