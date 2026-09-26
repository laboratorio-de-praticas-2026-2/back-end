import { Controller, Get, Post, Body, HttpCode, HttpStatus, ParseIntPipe, Param, Query } from '@nestjs/common';
import { AgendamentoService } from './agendamento.service.js';
import { CriarTipoAtendimentoDto } from './dto/criar-tipo-atendimento.dto.js';

@Controller('agendamento')
export class AgendamentoController {
  constructor(private readonly agendamentoService: AgendamentoService) { }

  @Get()
  @HttpCode(HttpStatus.OK)
  listar() {
    return this.agendamentoService.listarAtivos();
  }

  @Get('agendamentos')
  listarAgendamentos(
    @Query('data_inicio') data_inicio?: string,
    @Query('data_fim') data_fim?: string,
    @Query('status') status?: string,
    @Query('tipo_atendimento_id') tipo_atendimento_id?: string,
  ) {
    return this.agendamentoService.listarAgendamentos({
      data_inicio,
      data_fim,
      status,
      tipo_atendimento_id: tipo_atendimento_id ? Number(tipo_atendimento_id) : undefined,
    });
  }

  @Get('agendamentos/:id')
  buscarAgendamento(@Param('id', ParseIntPipe) id: number) {
  return this.agendamentoService.buscarAgendamento(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  cadastrar(@Body() body: CriarTipoAtendimentoDto) {
    return this.agendamentoService.cadastrar(body);
  }
}