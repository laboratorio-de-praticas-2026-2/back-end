import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';

import { PublicidadeService } from './publicidade.service.js';
import { CreatePublicidadeDto } from './dto/create-publicidade.dto.js';
import { UpdatePublicidadeDto } from './dto/update-publicidade.dto.js';
import { UpdateStatusPublicidadeDto } from './dto/update-status-publicidade.dto.js';

@Controller('publicidade')
export class PublicidadeController {

  constructor(
    private readonly publicidadeService: PublicidadeService,
  ) {}


  // =========================================================
  // ÁREA CONSUMIDORA / PUBLICIDADE
  // =========================================================

  // FRONT:
  // Endpoint utilizado pela área pública de Publicidade.
  // Retorna SOMENTE anúncios ativos.
  //
  // GET /publicidade
  @Get()
  listarAtivos() {
    return this.publicidadeService.listarAtivos();
  }


  // =========================================================
  // CMS / ADMINISTRAÇÃO
  // =========================================================

  // FRONT:
  // Utilizar na tela administrativa do CMS.
  // Retorna anúncios ativos e pausados.
  //
  // GET /publicidade/admin
  @Get('admin')
  listarTodos() {
    return this.publicidadeService.listarTodos();
  }


  // FRONT:
  // Busca os dados de um anúncio específico.
  // Útil principalmente para tela/formulário de edição.
  //
  // GET /publicidade/admin/:id
  @Get('admin/:id')
  buscarPorId(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.publicidadeService.buscarPorId(id);
  }


  // FRONT:
  // Cadastra um novo anúncio.
  //
  // POST /publicidade/admin
  @Post('admin')
  criar(
    @Body() dados: CreatePublicidadeDto,
  ) {
    return this.publicidadeService.criar(dados);
  }


  // FRONT:
  // Edita parcialmente um anúncio.
  // Não é necessário enviar todos os campos.
  //
  // PATCH /publicidade/admin/:id
  @Patch('admin/:id')
  atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dados: UpdatePublicidadeDto,
  ) {
    return this.publicidadeService.atualizar(id, dados);
  }


  // FRONT:
  // Altera somente o status do anúncio.
  //
  // ativo = false → pausa
  // ativo = true  → reativa
  //
  // PATCH /publicidade/admin/:id/status
  @Patch('admin/:id/status')
  atualizarStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dados: UpdateStatusPublicidadeDto,
  ) {
    return this.publicidadeService.atualizarStatus(id, dados);
  }


  // FRONT:
  // Remove definitivamente o anúncio.
  //
  // DELETE /publicidade/admin/:id
  @Delete('admin/:id')
  remover(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.publicidadeService.remover(id);
  }
}