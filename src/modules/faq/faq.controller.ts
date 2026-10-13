import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { FaqService } from './faq.service.js';
import { CreateFaqDto } from './dto/create-faq.dto.js';
import { UpdateFaqDto } from './dto/update-faq.dto.js';

@Controller('faq')
export class FaqController {
  constructor(private readonly faqService: FaqService) {}

  @Get()
  async listar(
    @Query('categoria') categoria?: string,
    @Query('palavra') palavra?: string,
  ) {
    return this.faqService.listar(categoria, palavra);
  }

  @Post()
  async create(@Body() createFaqDto: CreateFaqDto) {
    return this.faqService.create(createFaqDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string, 
    @Body() updateFaqDto: UpdateFaqDto
  ) {
    return this.faqService.update(+id, updateFaqDto);
  }

  @Get(':id')
  async buscarPorId(@Param('id') id: string) {
    return this.faqService.buscarPorId(Number(id));
  }

  @Patch(':id/status')
  async toggleStatus(@Param('id') id: string) {
    return this.faqService.toggleStatus(Number(id));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async excluir(@Param('id') id: string) {
    return this.faqService.excluir(Number(id));
  }
}