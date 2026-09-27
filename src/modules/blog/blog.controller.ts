import { Controller, Get, Query } from '@nestjs/common';
import { BlogService } from './blog.service.js';

@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Get()
  async listar(
    @Query('categoria') categoria?: string,
    @Query('titulo') titulo?: string,
  ) {
    return this.blogService.listar(categoria, titulo);
  }
}