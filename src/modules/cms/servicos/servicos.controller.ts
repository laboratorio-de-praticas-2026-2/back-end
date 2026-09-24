import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';

import { ServicosService } from './servicos.service';
import { CreateServicoDto } from './dto/create-servico.dto.js';
import { UpdateServicoDto } from './dto/update-servico.dto';
import { UpdateStatusServicoDto } from './dto/update-status-servico.dto';

@Controller('servicos')
export class ServicosController {

  constructor(
    // O Controller não acessa o banco diretamente.
    // Ele delega essa responsabilidade para o Service.
    private readonly servicosService: ServicosService,
  ) {}

  // Endpoint destinado ao consumo dos serviços disponíveis.
  //
  // FRONT:
  // GET /servicos
  //
  // Retorna somente serviços ativos, pois serviços pausados
  // não devem ser disponibilizados para a Vitrine.
  @Get()
  async listarAtivos() {
    return this.servicosService.listarAtivos();
  }

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


  // Cadastra um novo serviço através do CMS.
  //
  // FRONT ADMINISTRATIVO:
  // POST /servicos/admin
  //
  // O corpo da requisição deve seguir
  // o contrato definido em CreateServicoDto.
  @Post('admin')
  async criar(
    @Body() dados: CreateServicoDto,
  ) {
    return this.servicosService.criar(dados);
  }


  // Atualiza os dados de um serviço existente.
  //
  // FRONT ADMINISTRATIVO:
  // PATCH /servicos/admin/:id
  //
  // Não é necessário enviar todos os campos.
  // O Front pode enviar somente aquilo que foi alterado.
  @Patch('admin/:id')
  async atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dados: UpdateServicoDto,
  ) {
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
  @Patch('admin/:id/status')
  async atualizarStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dados: UpdateStatusServicoDto,
  ) {
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
  @Delete('admin/:id')
  async remover(
    @Param('id', ParseIntPipe) id: number,
  ) {
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
// To-do: Elaborar documentação descritiva e apagar comentários desnecessários para compreensão do fluxo do back -> front