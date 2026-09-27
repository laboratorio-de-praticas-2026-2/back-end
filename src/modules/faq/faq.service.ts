import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Faq } from '../../models/faq.model.js';

@Injectable()
export class FaqService {
  constructor(
    @InjectModel(Faq)
    private readonly faqModel: typeof Faq,
  ) {}

  async listar(categoria?: string, palavra?: string): Promise<Faq[]> {
    const filtros = [];

    if (categoria) {
      filtros.push({
        categoria,
      });
    }

    if (palavra) {
      filtros.push({
        [Op.or]: [
          {
            pergunta: {
              [Op.like]: `%${palavra}%`,
            },
          },
          {
            resposta: {
              [Op.like]: `%${palavra}%`,
            },
          },
        ],
      });
    }

    return this.faqModel.findAll({
      where: {
        status: true,
        [Op.and]: filtros,
      },
      order: [['id', 'ASC']],
    });
  }
}