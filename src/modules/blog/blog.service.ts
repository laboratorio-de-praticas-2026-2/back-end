import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, WhereOptions } from 'sequelize';
import { Blog } from '../../models/blog.model.js';
import { CreateBlogDto } from './dto/create-blog.dto.js';
import { UpdateBlogDto } from './dto/update-blog.dto.js';

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

  async create(createBlogDto: CreateBlogDto): Promise<Blog> {
    return await this.blogModel.create({ ...createBlogDto, ativo: true } as any);
  }

  async update(id: number, updateBlogDto: UpdateBlogDto): Promise<Blog> {
    const blog = await this.blogModel.findByPk(id);
    
    if (!blog) {
      throw new NotFoundException(`Artigo com ID ${id} não encontrado`);
    }
    
    return await blog.update(updateBlogDto);
  }
}

