import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { RecomendacaoService } from './recomendacao.service.js';
import { RecomendacaoController } from './recomendacao.controller.js';

import { Solicitacao } from '../../models/solicitacao.model.js';

@Module({
  imports: [SequelizeModule.forFeature([Solicitacao])],
  controllers: [RecomendacaoController],
  providers: [RecomendacaoService],
})
export class RecomendacaoModule {}