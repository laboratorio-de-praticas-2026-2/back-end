import { Controller, Get, Post, Put, Query, Body, Param } from '@nestjs/common';
import { BlogService } from './blog.service.js';
import { CreateBlogDto } from './dto/create-blog.dto.js';
import { UpdateBlogDto } from './dto/update-blog.dto.js';

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

  @Post()
  async create(@Body() createBlogDto: CreateBlogDto) {
    return this.blogService.create(createBlogDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string, 
    @Body() updateBlogDto: UpdateBlogDto
  ) {
    return this.blogService.update(+id, updateBlogDto);
  }
}