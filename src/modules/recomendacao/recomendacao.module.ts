import { Module } from '@nestjs/common';
import { RecomendacaoService } from './recomendacao.service.js';
import { RecomendacaoController } from './recomendacao.controller.js';
import { PrismaService } from '../../infra/prisma/prisma.service.js';

@Module({
  controllers: [RecomendacaoController],
  providers: [RecomendacaoService, PrismaService],
})
export class RecomendacaoModule {}