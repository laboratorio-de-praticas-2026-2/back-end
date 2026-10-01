import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { Publicidade } from './publicidade.model.js';
import { PublicidadeService } from './publicidade.service.js';
import { PublicidadeController } from './publicidade.controller.js';

@Module({
  imports: [
    // Registra o Model no Sequelize dentro deste módulo.
    SequelizeModule.forFeature([Publicidade]),
  ],

  // Disponibiliza as rotas HTTP de Publicidade.
  controllers: [PublicidadeController],

  // Disponibiliza as regras de negócio utilizadas pelo Controller.
  providers: [PublicidadeService],

  // Mantemos exportado caso outro módulo precise utilizar
  // as regras de Publicidade futuramente.
  exports: [PublicidadeService],
})
export class PublicidadeModule {}