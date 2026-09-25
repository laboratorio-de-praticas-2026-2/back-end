import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SolicitacoesService } from './solicitacoes.service.js';
// import { AdminGuard } from '../../commons/guards/admin.guard.js';


@Controller('dashboard/solicitacoes')
// @UseGuards(AdminGuard)
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