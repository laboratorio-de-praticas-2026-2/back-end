import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import { Publicidade } from './publicidade.model.js';
import { CreatePublicidadeDto } from './dto/create-publicidade.dto.js';
import { UpdatePublicidadeDto } from './dto/update-publicidade.dto.js';
import { UpdateStatusPublicidadeDto } from './dto/update-status-publicidade.dto.js';

@Injectable()
export class PublicidadeService {

  constructor(
    @InjectModel(Publicidade)
    private readonly publicidadeModel: typeof Publicidade,
  ) {}

  // =========================================================
  // ÁREA CONSUMIDORA / PUBLICIDADE
  // =========================================================

  // Retorna somente anúncios ativos.
  //
  // FRONT:
  // Este método alimentará a área de Publicidade do sistema.
  // Anúncios pausados (ativo = false) não serão retornados.
  async listarAtivos(): Promise<Publicidade[]> {
    return this.publicidadeModel.findAll({
      where: {
        ativo: true,
      },
    });
  }


  // =========================================================
  // CMS / ADMINISTRAÇÃO
  // =========================================================

  // Retorna todos os anúncios cadastrados.
  //
  // FRONT:
  // Utilizar no CMS para exibir anúncios ativos e pausados.
  async listarTodos(): Promise<Publicidade[]> {
    return this.publicidadeModel.findAll();
  }


  // Busca um anúncio específico pelo ID.
  //
  // Esse método também será reutilizado internamente
  // pelos fluxos de edição, status e remoção.
  async buscarPorId(id: number): Promise<Publicidade> {
    const publicidade = await this.publicidadeModel.findByPk(id);

    if (!publicidade) {
      throw new NotFoundException(
        `Anúncio com ID ${id} não encontrado.`,
      );
    }

    return publicidade;
  }


  // Cadastra um novo anúncio.
  //
  // FRONT:
  // O anúncio nasce ativo por padrão e, após persistido,
  // poderá ser retornado pelo endpoint da área de Publicidade.
  async criar(dados: CreatePublicidadeDto): Promise<Publicidade> {
    return this.publicidadeModel.create({
      titulo: dados.titulo,
      conteudo: dados.conteudo,
      urlImagem: dados.urlImagem ?? null,
      ativo: true,
    });
  }


  // Edita parcialmente um anúncio existente.
  //
  // FRONT:
  // Não é necessário enviar o objeto completo.
  // Somente os campos recebidos serão alterados.
  async atualizar(
    id: number,
    dados: UpdatePublicidadeDto,
  ): Promise<Publicidade> {

    const publicidade = await this.buscarPorId(id);

    await publicidade.update(dados);

    return publicidade;
  }


  // Altera exclusivamente o status do anúncio.
  //
  // FRONT:
  // ativo = false → anúncio pausado
  // ativo = true  → anúncio disponível novamente
  async atualizarStatus(
    id: number,
    dados: UpdateStatusPublicidadeDto,
  ): Promise<Publicidade> {

    const publicidade = await this.buscarPorId(id);

    publicidade.ativo = dados.ativo;

    await publicidade.save();

    return publicidade;
  }


  // Remove definitivamente um anúncio.
  //
  // FRONT:
  // Após a exclusão, o registro deixa de aparecer tanto
  // no CMS quanto na área consumidora de Publicidade.
  async remover(id: number): Promise<{ message: string }> {

    const publicidade = await this.buscarPorId(id);

    await publicidade.destroy();

    return {
      message: 'Anúncio removido com sucesso.',
    };
  }
}