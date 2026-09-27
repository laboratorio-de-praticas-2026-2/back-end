import { Module } from '@nestjs/common';
import { RecomendacaoService } from './recomendacao.service.js';
import { RecomendacaoController } from './recomendacao.controller.js';

@Module({
  controllers: [RecomendacaoController],
  providers: [RecomendacaoService],
})
export class RecomendacaoModule {}