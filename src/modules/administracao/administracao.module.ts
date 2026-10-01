import { Module } from '@nestjs/common';
import { AdministracaoController } from './administracao.controller.js';
import { AdministracaoService } from './administracao.service.js';

@Module({
  controllers: [AdministracaoController],
  providers: [AdministracaoService],
})
export class AdministracaoModule {}
