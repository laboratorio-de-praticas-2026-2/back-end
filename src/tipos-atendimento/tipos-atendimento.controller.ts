import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { TiposAtendimentoService, CriarTipoAtendimentoDto } from './tipos-atendimento.service.js';

@Controller('tipos-atendimento')
export class TiposAtendimentoController {
  constructor(private readonly tiposAtendimentoService: TiposAtendimentoService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  listar() {
    return this.tiposAtendimentoService.listarAtivos();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  cadastrar(@Body() body: CriarTipoAtendimentoDto) {
    return this.tiposAtendimentoService.cadastrar(body);
  }
}