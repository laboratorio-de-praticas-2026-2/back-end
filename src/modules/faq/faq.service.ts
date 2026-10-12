import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Faq } from '../../models/faq.model.js';
import { CreateFaqDto } from './dto/create-faq.dto.js';
import { UpdateFaqDto } from './dto/update-faq.dto.js';

@Injectable()
export class FaqService {
  constructor(
    @InjectModel(Faq)
    private readonly faqModel: typeof Faq,
  ) {}

  async create(createFaqDto: CreateFaqDto): Promise<Faq> {
    return await this.faqModel.create({
      ...createFaqDto,
      status: true,
    } as any);
  }

  async update(id: number, updateFaqDto: UpdateFaqDto): Promise<Faq> {
    const faq = await this.faqModel.findByPk(id);
    
    if (!faq) {
      throw new NotFoundException(`FAQ com ID ${id} não encontrada`);
    }

    return await faq.update(updateFaqDto);
  }

  async buscarPorId(id: number): Promise<Faq> {
    const faq = await this.faqModel.findByPk(id);

    if (!faq) {
      throw new NotFoundException(`FAQ com ID ${id} não encontrada`);
    }

    return faq;
  }

  async inativar(id: number): Promise<Faq> {
    const faq = await this.buscarPorId(id);

    return await faq.update({ status: false } as any);
  }

  async excluir(id: number): Promise<void> {
    const faq = await this.buscarPorId(id); 

    await faq.destroy();
  }
}