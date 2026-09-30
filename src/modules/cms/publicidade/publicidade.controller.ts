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

// Infraestrutura de autenticação já existente no projeto.
// CurrentUser recupera o usuário identificado através do JWT.
import {
  CurrentUser,
} from '../../../commons/decorators/current-role.decorator.js';

import type {
  AuthenticatedUser,
} from '../../../commons/decorators/current-role.decorator.js';

// Regra compartilhada responsável por garantir que somente
// usuários administradores executem operações administrativas.
import { requireAdmin } from '../../../commons/require-admin.js';


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
  //
  // GET /publicidade
  //
  // Esta rota permanece pública.
  //
  // O Service retorna SOMENTE anúncios ativos,
  // permitindo que anúncios pausados deixem de aparecer
  // automaticamente na área consumidora.
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


  // =========================================================
  // OPERAÇÕES ADMINISTRATIVAS PROTEGIDAS
  // =========================================================

  // FRONT:
  // Cadastra um novo anúncio.
  //
  // POST /publicidade/admin
  //
  // SEGURANÇA:
  // CurrentUser identifica o usuário da requisição.
  // requireAdmin impede a operação quando:
  //
  // - não existe usuário autenticado -> HTTP 401
  // - usuário não é administrador   -> HTTP 403
  //
  // Somente administradores chegam ao Service.
  @Post('admin')
  criar(
    @Body() dados: CreatePublicidadeDto,
    @CurrentUser() user: AuthenticatedUser | null,
  ) {
    requireAdmin(user);

    return this.publicidadeService.criar(dados);
  }


  // FRONT:
  // Edita parcialmente um anúncio.
  // Não é necessário enviar todos os campos.
  //
  // PATCH /publicidade/admin/:id
  //
  // A operação exige usuário autenticado
  // com perfil administrador.
  @Patch('admin/:id')
  atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dados: UpdatePublicidadeDto,
    @CurrentUser() user: AuthenticatedUser | null,
  ) {
    requireAdmin(user);

    return this.publicidadeService.atualizar(id, dados);
  }


  // FRONT:
  // Altera somente o status do anúncio.
  //
  // ativo = false -> pausa
  // ativo = true  -> reativa
  //
  // PATCH /publicidade/admin/:id/status
  //
  // Como GET /publicidade retorna somente registros ativos,
  // pausar ou reativar um anúncio afeta diretamente
  // sua disponibilidade para a área pública.
  //
  // A operação exige usuário autenticado
  // com perfil administrador.
  @Patch('admin/:id/status')
  atualizarStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dados: UpdateStatusPublicidadeDto,
    @CurrentUser() user: AuthenticatedUser | null,
  ) {
    requireAdmin(user);

    return this.publicidadeService.atualizarStatus(id, dados);
  }


  // FRONT:
  // Remove definitivamente o anúncio.
  //
  // DELETE /publicidade/admin/:id
  //
  // Após a remoção, o anúncio deixa de existir no CMS
  // e também deixa de ser disponibilizado para a área pública.
  //
  // A operação exige usuário autenticado
  // com perfil administrador.
  @Delete('admin/:id')
  remover(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser | null,
  ) {
    requireAdmin(user);

    return this.publicidadeService.remover(id);
  }
}