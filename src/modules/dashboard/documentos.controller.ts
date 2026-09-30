import { Controller, Get, Query } from '@nestjs/common';
import { DocumentosService } from './documentos.service.js';

@Controller('dashboard/documentos')
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