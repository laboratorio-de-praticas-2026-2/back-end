import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { RelatoriosProducer } from './relatorios.producer.js';

@Controller('relatorios')
export class RelatoriosController {
  constructor(
    private readonly relatoriosProducer: RelatoriosProducer,
  ) {}

  @Post('generate')
  async gerarRelatorio(@Body() body: { relatorioId: number }) {
    await this.relatoriosProducer.adicionarGeracao(body.relatorioId);

    return {
      mensagem: 'Job de geração de relatório enviado para a fila',
    };
  }

  @Get(':id')
  async buscarRelatorio(@Param('id') id: string) {
    return {
      id: Number(id),
    };
  }

  @Get(':id/pdf')
  async buscarPdf(@Param('id') id: string) {
    return {
      id: Number(id),
      mensagem: 'PDF do relatório',
    };
  }

  @Delete(':id')
  async excluirRelatorio(@Param('id') id: string) {
    return {
      id: Number(id),
      mensagem: 'Relatório excluído',
    };
  }
}