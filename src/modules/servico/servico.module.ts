import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Servico } from './servico.js';
import { ServicoService } from './servico.service.js';
import { ServicoController } from './servico.controller.js';

@Module({
  imports: [SequelizeModule.forFeature([Servico])],
  controllers: [ServicoController],
  providers: [ServicoService],
  exports: [ServicoService],
})
export class ServicoModule {}