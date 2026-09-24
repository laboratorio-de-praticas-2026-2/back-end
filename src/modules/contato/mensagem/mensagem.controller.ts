import { Body, Controller, Get, Post } from '@nestjs/common';
import { MensagemService } from './mensagem.service.js';
import { CreateMensagemDto } from './dto/create-mensagem.dto.js';

@Controller('mensagem')
export class MensagemController {
  constructor(private readonly mensagemService: MensagemService) {}

  @Post()
  async criar(@Body() dto: CreateMensagemDto) {
    return this.mensagemService.criarMensagem(dto);
  }

  @Get()
  async listar() {
    return this.mensagemService.listarHistorico();
  }
}