import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';

import { ContatoService } from './contato.service.js';
import { UpdateContatoDto } from './dto/update-contato.dto.js';
import { CadastroPjDto } from './dto/cadastro-pj.dto.js';

import { AuthGuard } from '../auth/guards/auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { NivelUsuarioEnum } from '../../commons/constantes/nivel-usuario-enum.js';

@Controller('contato')
export class ContatoController {
  constructor(private readonly contatoService: ContatoService) {}

  @Post('cadastro-pj')
  async cadastrarPj(@Body() dto: CadastroPjDto) {
    return this.contatoService.cadastrarPj(dto);
  }

  @Put()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(NivelUsuarioEnum.administrador)
  putContact(@Body() updateContatoDto: UpdateContatoDto) {
    return this.contatoService.putContact(updateContatoDto);
  }

  @Get()
  getContact() {
    return this.contatoService.getContact();
  }
}