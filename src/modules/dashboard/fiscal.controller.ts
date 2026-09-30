import { Controller, Get, Query } from '@nestjs/common';
import { FiscalService } from './fiscal.service.js';
import { PeriodFilterDto } from './dto/period-filter.dto.js';

@Controller('dashboard/fiscal')
export class FiscalController {
  constructor(private readonly fiscalService: FiscalService) {}

  @Get()
  async getIndicadores(@Query() query: PeriodFilterDto) {
    return this.fiscalService.getIndicadores(query.startDate, query.endDate);
  }
}