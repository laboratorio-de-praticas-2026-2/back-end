import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpCode, HttpStatus } from '@nestjs/common';
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

  @Get(':id')
  async buscarPorId(@Param('id') id: string) {
    return this.faqService.buscarPorId(Number(id));
  }

  @Patch(':id/inativar')
  async inativar(@Param('id') id: string) {
    return this.faqService.inativar(Number(id));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async excluir(@Param('id') id: string) {
    return this.faqService.excluir(Number(id));
  }
}