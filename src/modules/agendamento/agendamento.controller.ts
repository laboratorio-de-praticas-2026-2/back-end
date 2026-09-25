import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
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

  @Post()
  @HttpCode(HttpStatus.CREATED)
  cadastrar(@Body() body: CriarTipoAtendimentoDto) {
    return this.agendamentoService.cadastrar(body);
  }
}