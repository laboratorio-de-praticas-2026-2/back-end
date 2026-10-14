import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, WhereOptions } from 'sequelize';
import { Faq } from '../../models/faq.model.js';
import { CreateFaqDto } from './dto/create-faq.dto.js';
import { UpdateFaqDto } from './dto/update-faq.dto.js';

@Injectable()
export class FaqService {
  constructor(
    @InjectModel(Faq)
    private readonly faqModel: typeof Faq,
  ) {}


async listar(categoria?: string, palavra?: string): Promise<Faq[]> {
  const where: WhereOptions = {
    status: true,
    ...(categoria ? { categoria } : {}),
    ...(palavra
      ? {
          [Op.or]: [
            { pergunta: { [Op.like]: `%${palavra}%` } },
            { resposta: { [Op.like]: `%${palavra}%` } },
          ],
        }
      : {}),
  };

  return this.faqModel.findAll({ where });
}

  async create(createFaqDto: CreateFaqDto): Promise<Faq> {
    return await this.faqModel.create({
      ...createFaqDto,
      status: true,
    } as any);
  }

  async update(id: number, updateFaqDto: UpdateFaqDto): Promise<Faq> {
    const faq = await this.faqModel.findByPk(id);
    if (!faq) throw new NotFoundException(`FAQ com ID ${id} não encontrada`);
    return await faq.update(updateFaqDto);
  }

  async buscarPorId(id: number): Promise<Faq> {
    const faq = await this.faqModel.findByPk(id);
    if (!faq) throw new NotFoundException(`FAQ com ID ${id} não encontrada`);
    return faq;
  }

  async toggleStatus(id: number): Promise<Faq> {
    const faq = await this.buscarPorId(id);
    return await faq.update({ status: !faq.status } as any);
  }

  async excluir(id: number): Promise<void> {
    const faq = await this.buscarPorId(id);
    await faq.destroy();
  }
}