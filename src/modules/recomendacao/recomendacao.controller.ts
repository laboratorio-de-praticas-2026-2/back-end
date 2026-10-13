
import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { RecomendacaoService } from './recomendacao.service.js';

@Controller('recomendacao')
export class RecomendacaoController {
  constructor(private readonly recomendacaoService: RecomendacaoService) {}

  @Get(':usuarioId')
  async obterRecomendacao(
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
  ) {
    return this.recomendacaoService.obterRecomendacao(usuarioId);
  }
}
