import { Controller, Get, Query } from '@nestjs/common';
import { FinanceiroService } from './financeiro.service.js';
 // Ajuste o caminho do seu AdminGuard

@Controller('dashboard')
export class FinanceiroController {
  constructor(private readonly financeiroService: FinanceiroService) {}

  @Get('financeiro')
  async getDashboardFinanceiro(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.financeiroService.getDashboardFinanceiro(startDate, endDate);
  }
}
