import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateFaqDto } from './dto/create-faq.dto.js';
import { UpdateFaqDto } from './dto/update-faq.dto.js';

export interface FaqItem {
  id: string;
  pergunta: string;
  resposta: string;
  categoria: string;
  createdAt: Date;
  updatedAt?: Date;
}

@Injectable()
export class FaqService {
  private faqs: FaqItem[] = [];

  async create(createFaqDto: CreateFaqDto) {
    const newFaq: FaqItem = {
      id: String(this.faqs.length + 1),
      ...createFaqDto,
      createdAt: new Date(),
    };
    this.faqs.push(newFaq);
    return newFaq;
  }

  async update(id: string, updateFaqDto: UpdateFaqDto) {
    const index = this.faqs.findIndex((faq) => faq.id === id);
    if (index === -1) {
      throw new NotFoundException(`FAQ com ID ${id} não encontrado`);
    }

    this.faqs[index] = {
      ...this.faqs[index],
      ...updateFaqDto,
      updatedAt: new Date(),
    };

    return this.faqs[index];
  }
}