import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, WhereOptions } from 'sequelize';
import { Blog } from '../../models/blog.model.js';

@Injectable()
export class BlogService {
  constructor(
    @InjectModel(Blog)
    private readonly blogModel: typeof Blog,
  ) {}

  async listar(categoria?: string, titulo?: string): Promise<Blog[]> {
    const where: WhereOptions = {
      ativo: true,
    };

    if (categoria) {
      where.categoria = categoria;
    }

    if (titulo) {
      where.titulo = {
        [Op.like]: `%${titulo}%`,
      };
    }

    return this.blogModel.findAll({
      where,
      order: [['data_publicacao', 'DESC']],
    });
  }
}