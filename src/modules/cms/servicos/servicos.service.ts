import { Injectable, NotFoundException, } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import { Servico } from './servico.model';
import { CreateServicoDto } from './dto/create-servico.dto.js';
import { UpdateServicoDto } from './dto/update-servico.dto';
import { UpdateStatusServicoDto } from './dto/update-status-servico.dto';

@Injectable()
export class ServicosService {

  constructor(
    // Injeta o Model Sequelize que representa a tabela "servico".
    // A partir daqui o Service consegue consultar o banco.
    @InjectModel(Servico)
    private readonly servicoModel: typeof Servico,
  ) {}

  // Retorna os serviços disponíveis para consumo pela Vitrine.
  //
  // REGRA DA ISSUE:
  // - ativo = true  -> disponível na Vitrine
  // - ativo = false -> pausado e não deve aparecer
  async listarAtivos(): Promise<Servico[]> {
    return this.servicoModel.findAll({
      where: {
        ativo: true,
      },
    });
  }


  // Retorna todos os serviços para gerenciamento pelo CMS.
  //
  // CMS / FRONT ADMINISTRATIVO:
  // Diferente da Vitrine, o painel administrativo precisa
  // receber tanto serviços ativos quanto pausados.
  //
  // Isso permite que um serviço pausado continue visível
  // no CMS e possa ser reativado posteriormente.
  async listarTodos(): Promise<Servico[]> {
    return this.servicoModel.findAll();
  }


  // Busca um serviço específico através do seu identificador.
  //
  // CMS / FRONT:
  // Essa operação será utilizada principalmente ao abrir
  // os dados de um serviço para visualização ou edição.
  //
  // Exemplo:
  // GET /servicos/admin/5
  async buscarPorId(id: number): Promise<Servico> {

  const servico = await this.servicoModel.findByPk(id);

  // Caso nenhum serviço possua o ID informado,
  // retornamos HTTP 404 para o consumidor da API.
  if (!servico) {
    throw new NotFoundException(
      `Serviço com ID ${id} não encontrado.`,
    );
  }

  return servico;
  }


  // Cadastra um novo serviço no sistema.
  //
  // Os dados recebidos já passaram pelas validações
  // definidas no CreateServicoDto.
  //
  // REGRA:
  // Um novo serviço nasce ativo por padrão e,
  // consequentemente, fica disponível para a Vitrine.
  async criar(
    dados: CreateServicoDto,
  ): Promise<Servico> {

    return this.servicoModel.create({
      nome: dados.nome,
      descricao: dados.descricao ?? null,
      valorBase:
        dados.valorBase !== undefined
          ? String(dados.valorBase)
          : null,
      prazoEstimadoDias:
        dados.prazoEstimadoDias ?? null,
      ativo: true,
    });
  }


  // Atualiza os dados de um serviço existente.
  //
  // Primeiro verificamos se o serviço realmente existe.
  // Depois aplicamos somente os campos enviados pelo CMS.
  //
  // Alterar um serviço NÃO altera automaticamente seu status.
  async atualizar(
    id: number,
    dados: UpdateServicoDto,
  ): Promise<Servico> {

  // Reaproveitamos uma regra que já existe.
  // buscarPorId() também gera 404 caso o registro não exista.
  const servico = await this.buscarPorId(id);

  await servico.update({
    ...(dados.nome !== undefined && {
      nome: dados.nome,
    }),

    ...(dados.descricao !== undefined && {
      descricao: dados.descricao,
    }),

    ...(dados.valorBase !== undefined && {
      valorBase: String(dados.valorBase),
    }),

    ...(dados.prazoEstimadoDias !== undefined && {
      prazoEstimadoDias: dados.prazoEstimadoDias,
    }),
  });

  return servico;
  }


  // Altera exclusivamente o status de disponibilidade do serviço.
  //
  // REGRA DA ISSUE:
  // ativo = true  -> serviço disponível para a Vitrine
  // ativo = false -> serviço pausado e não exibido na Vitrine
  //
  // O registro permanece no banco mesmo quando pausado.
  async atualizarStatus(
    id: number,
    dados: UpdateStatusServicoDto,
  ): Promise<Servico> {

  // Reaproveitamos buscarPorId() para garantir que
  // somente serviços existentes possam ser alterados.
  //
  // Caso o ID não exista, buscarPorId() retorna 404.
  const servico = await this.buscarPorId(id);

  await servico.update({
    ativo: dados.ativo,
  });

  return servico;
  }

  // Remove um serviço cadastrado.
  //
  // Antes da exclusão, verificamos se o serviço existe.
  // Caso não exista, buscarPorId() já retorna HTTP 404.
  //
  // IMPORTANTE:
  // Serviços podem possuir relacionamentos com outras entidades.
  // Caso o banco impeça a exclusão por integridade referencial,
  // o registro não deve ser removido de forma forçada.
  async remover(id: number): Promise<void> {

    const servico = await this.buscarPorId(id);

    await servico.destroy();
  }
}



// Comentários dispostos temporariamente até a integração do front-end
// To-do: Elaborar documentação descritiva e apagar comentários desnecessários para compreensão do fluxo do back -> front