import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ClientesService } from './clientes.service.js';
 // Ajuste o caminho do seu AdminGuard

@Controller('dashboard')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Get('clientes')
  async getDashboardClientes(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.clientesService.getDashboardClientes(startDate, endDate);
  }
}