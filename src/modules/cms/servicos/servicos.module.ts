import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { Servico } from './servico.model';
import { ServicosService } from './servicos.service';
import { ServicosController } from './servicos.controller.js';


@Module({
  imports: [
    SequelizeModule.forFeature([Servico]),
  ],

  // Registra o Service como provider deste módulo.
  providers: [ServicosService],

  //Endpoints HTTP disponibilizados pelo modulo
  controllers: [ServicosController],
})
export class ServicosModule {}


// Comentários dispostos temporariamente até a integração do front-end
// To-do: Elaborar documentação descritiva e apagar comentários desnecessários para compreensão do fluxo do back -> front