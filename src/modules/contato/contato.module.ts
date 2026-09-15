import { Module } from '@nestjs/common';
import { ContatoService } from './contato.service.js';
import { ContatoController } from './contato.controller.js';
//import { PrismaModule } from '';

@Module({
  //imports: [PrismaModule],
  controllers: [ContatoController],
  providers: [ContatoService],
})
export class ContatoModule {}
