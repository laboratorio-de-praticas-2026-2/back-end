import { Controller, Get, Query } from '@nestjs/common';
import { GeralService } from './geral.service.js';
import { PeriodFilterDto } from './dto/period-filter.dto.js';

@Controller('dashboard/geral')
export class GeralController {
  constructor(private readonly geralService: GeralService) {}

  @Get()
  async getIndicadores(@Query() query: PeriodFilterDto) {
    return this.geralService.getIndicadores(
      query.startDate,
      query.endDate,
    );
  }
}