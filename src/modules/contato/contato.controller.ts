import {Body, Controller,Get,HttpCode,HttpStatus,Post,Put,UseGuards,} from '@nestjs/common';

import { NivelUsuarioEnum } from '../../commons/constantes/nivel-usuario-enum.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';

import { ContatoService } from './contato.service.js';
import { UpdateContatoDto } from './dto/update-contato.dto.js';
import { AuthService } from '../../commons/auth.service.js';
import { CadastroPjDto } from './dto/cadastro-pj.dto.js';

@Controller('contato')
export class ContatoController {
  constructor(
    private readonly contatoService: ContatoService,
    private readonly authService: AuthService,
  ) {}

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

  @Post('cadastro-pj')
  @HttpCode(HttpStatus.CREATED)
  async cadastrarPj(@Body() dto: CadastroPjDto) {
    return await this.contatoService.cadastrarPj(dto);
  }
}