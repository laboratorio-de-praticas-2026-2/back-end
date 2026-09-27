import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Servico } from './servico.js';
import { CreateServicoDto } from './dto/criar-servico.dto.js';
import { UpdateServicoDto } from './dto/atualizar-servico.dto.js';

@Injectable()
export class ServicoService {
  constructor(
    @InjectModel(Servico)
    private servicoModel: typeof Servico,
  ) {}

  async create(createServicoDto: CreateServicoDto): Promise<Servico> {
    return this.servicoModel.create(createServicoDto as any);
  }

  // Se apenasAtivos for true, traz somente serviços com ativo = true
  async findAll(apenasAtivos = false): Promise<Servico[]> {
    if (apenasAtivos) {
      return this.servicoModel.findAll({ where: { ativo: true } });
    }
    return this.servicoModel.findAll();
  }

  async findOne(id: number): Promise<Servico> {
    const servico = await this.servicoModel.findByPk(id);
    if (!servico) {
      throw new NotFoundException(`Serviço com ID ${id} não encontrado.`);
    }
    return servico;
  }

  async update(id: number, updateServicoDto: UpdateServicoDto): Promise<Servico> {
    const servico = await this.findOne(id);
    await servico.update(updateServicoDto);
    return servico;
  }

  async remove(id: number): Promise<void> {
    const servico = await this.findOne(id);
    await servico.destroy();
  }
}