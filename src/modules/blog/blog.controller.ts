import { Controller, Get, Post, Put, Patch, Delete, Query, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
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

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.blogService.getById(+id);
  }

  @Patch(':id/status')
  async toggleStatus(@Param('id') id: string) {
    return this.blogService.toggleStatus(+id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    return this.blogService.delete(+id);
  }
}