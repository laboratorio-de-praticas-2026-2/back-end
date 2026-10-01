import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { RecomendacaoService } from './recomendacao.service.js';

@Controller('recomendacao')
export class RecomendacaoController {
  constructor(private readonly recomendacaoService: RecomendacaoService) {}

  @Get('regularizacao/:usuarioId')
  async testarRegularizacao(@Param('usuarioId', ParseIntPipe) usuarioId: number) {
    const resultado =
      await this.recomendacaoService.verificarRecomendacaoRegularizacaoObrigacoesFiscais(usuarioId);

    return resultado ?? { message: 'Nenhuma recomendação encontrada para o usuário informado.' };
  }
}