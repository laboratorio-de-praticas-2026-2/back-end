import { Controller, Get, Param, ParseIntPipe, Patch, Body, UseGuards } from '@nestjs/common';
import { NivelUsuarioEnum } from '../../commons/constantes/nivel-usuario-enum.js';
import { AdministracaoService } from './administracao.service.js';
import { UpdateUsuarioAdminDto } from './dto/update-usuario-admin.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';

@Controller('admin/usuarios')
@UseGuards(AuthGuard, RolesGuard)
@Roles(NivelUsuarioEnum.administrador)
export class AdministracaoController {
  constructor(private readonly administracaoService: AdministracaoService) {}

  @Get()
  listarUsuarios() {
    return this.administracaoService.listarUsuarios();
  }

  @Get(':id')
  buscarUsuario(@Param('id', ParseIntPipe) id: number) {
    return this.administracaoService.buscarUsuario(id);
  }

  @Patch(':id')
  atualizarUsuario(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUsuarioAdminDto,
  ) {
    return this.administracaoService.atualizarUsuario(id, dto);
  }
}
