import { Controller, Get, Query } from '@nestjs/common';
import { FaqService } from './faq.service.js';

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
}