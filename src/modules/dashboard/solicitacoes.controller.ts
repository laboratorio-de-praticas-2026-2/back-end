import { Controller, Get, Query } from '@nestjs/common';
import { SolicitacoesService } from './solicitacoes.service.js';


@Controller('dashboard/solicitacoes')
export class SolicitacoesController {
    constructor (private readonly solicitacoesService: SolicitacoesService) {}

    @Get()
    async getIndicadores(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.solicitacoesService.getIndicadores(startDate, endDate);
    }
}