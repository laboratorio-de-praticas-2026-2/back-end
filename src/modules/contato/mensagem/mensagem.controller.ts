import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { NivelUsuarioEnum } from '../../../commons/constantes/nivel-usuario-enum.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { AuthGuard } from '../../auth/guards/auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
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
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(NivelUsuarioEnum.administrador)
  async listar() {
    return this.mensagemService.listarHistorico();
  }
}
