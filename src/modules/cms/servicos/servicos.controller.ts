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

import { ServicosService } from './servicos.service.js';
import { CreateServicoDto } from './dto/create-servico.dto.js';
import { UpdateServicoDto } from './dto/update-servico.dto.js';
import { UpdateStatusServicoDto } from './dto/update-status-servico.dto.js';

// Infraestrutura de autenticação já existente no projeto.
// CurrentUser recupera o usuário identificado através do JWT.
import {
  CurrentUser,
} from '../../../commons/decorators/current-role.decorator.js';

import type {
  AuthenticatedUser,
} from '../../../commons/decorators/current-role.decorator.js';

// Regra compartilhada criada para garantir que somente
// usuários administradores executem operações administrativas.
import { requireAdmin } from '../../../commons/require-admin.js';


@Controller('servicos')
export class ServicosController {

  constructor(
    // O Controller não acessa o banco diretamente.
    // Ele delega essa responsabilidade para o Service.
    private readonly servicosService: ServicosService,
  ) {}


  // ============================================================
  // CONSULTA PÚBLICA
  // ============================================================

  // Endpoint destinado ao consumo dos serviços disponíveis.
  //
  // FRONT / VITRINE:
  // GET /servicos
  //
  // Esta rota permanece pública.
  //
  // Retorna somente serviços ativos, pois serviços pausados
  // não devem ser disponibilizados para a Vitrine.
  @Get()
  async listarAtivos() {
    return this.servicosService.listarAtivos();
  }


  // ============================================================
  // CONSULTAS ADMINISTRATIVAS
  // ============================================================

  // CMS: serviços ativos e pausados.
  @Get('admin')
  async listarTodos() {
    return this.servicosService.listarTodos();
  }


  // Retorna um serviço específico para gerenciamento no CMS.
  //
  // FRONT ADMINISTRATIVO:
  // GET /servicos/admin/:id
  //
  // Exemplo:
  // GET /servicos/admin/5
  @Get('admin/:id')
  async buscarPorId(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.servicosService.buscarPorId(id);
  }


  // ============================================================
  // OPERAÇÕES ADMINISTRATIVAS PROTEGIDAS
  // ============================================================

  // Cadastra um novo serviço através do CMS.
  //
  // FRONT ADMINISTRATIVO:
  // POST /servicos/admin
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
  async criar(
    @Body() dados: CreateServicoDto,
    @CurrentUser() user: AuthenticatedUser | null,
  ) {
    requireAdmin(user);

    return this.servicosService.criar(dados);
  }


  // Atualiza os dados de um serviço existente.
  //
  // FRONT ADMINISTRATIVO:
  // PATCH /servicos/admin/:id
  //
  // Não é necessário enviar todos os campos.
  // O Front pode enviar somente aquilo que foi alterado.
  //
  // A operação exige usuário autenticado com perfil administrador.
  @Patch('admin/:id')
  async atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dados: UpdateServicoDto,
    @CurrentUser() user: AuthenticatedUser | null,
  ) {
    requireAdmin(user);

    return this.servicosService.atualizar(id, dados);
  }


  // Ativa ou pausa um serviço.
  //
  // FRONT ADMINISTRATIVO:
  // PATCH /servicos/admin/:id/status
  //
  // Body:
  // { "ativo": true }  -> reativa
  // { "ativo": false } -> pausa
  //
  // A alteração afeta diretamente a disponibilidade
  // do serviço para a Vitrine.
  //
  // A operação exige usuário autenticado com perfil administrador.
  @Patch('admin/:id/status')
  async atualizarStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dados: UpdateStatusServicoDto,
    @CurrentUser() user: AuthenticatedUser | null,
  ) {
    requireAdmin(user);

    return this.servicosService.atualizarStatus(id, dados);
  }


  // Remove um serviço cadastrado.
  //
  // FRONT ADMINISTRATIVO:
  // DELETE /servicos/admin/:id
  //
  // Após a remoção, o serviço deixa de estar disponível
  // tanto no CMS quanto na Vitrine.
  //
  // Caso o serviço não exista, a API retorna 404.
  //
  // A operação exige usuário autenticado com perfil administrador.
  @Delete('admin/:id')
  async remover(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser | null,
  ) {
    requireAdmin(user);

    await this.servicosService.remover(id);

    return {
      message: 'Serviço removido com sucesso.',
    };
  }


  // TODO:
  // validar comportamento de DELETE
  // quando Serviço possuir histórico associado
}


// Comentários dispostos temporariamente até a integração do front-end
// To-do: Elaborar documentação descritiva e apagar comentários
// desnecessários para compreensão do fluxo do back -> front