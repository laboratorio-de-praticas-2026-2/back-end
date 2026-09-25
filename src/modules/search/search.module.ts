import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Empresa } from '../../models/empresa.model.js';
import { Usuario } from '../../models/usuario.model.js';
import { SearchController } from './search.controller.js';
import { SearchService } from './search.service.js';

@Module({
  imports: [SequelizeModule.forFeature([Usuario, Empresa])],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
