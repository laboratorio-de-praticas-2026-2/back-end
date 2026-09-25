import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DocumentosService } from './documentos.service.js';
// import { AdminGuard } from '../../commons/guards/admin.guards.js';

@Controller('dashboard/documentos')
// @UseGuards(AdminGuard)
export class DocumentosController {
    constructor(private readonly documentosService: DocumentosService) {}

    @Get()
    async getIndicadores(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.documentosService.getIndicadores(startDate, endDate);
    }
}