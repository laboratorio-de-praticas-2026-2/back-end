import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Report } from '../../models/report.model.js';
import { RelatoriosController } from './relatorios.controller.js';
import { RelatoriosService } from './relatorios.service.js';

@Module({
  imports: [SequelizeModule.forFeature([Report])],
  controllers: [RelatoriosController],
  providers: [RelatoriosService],
})
export class RelatoriosModule {}