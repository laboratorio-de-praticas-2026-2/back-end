import { Module } from '@nestjs/common';
import { DisparoAgendamentoService } from './disparo.service.js';

@Module({
  providers: [DisparoAgendamentoService],
  exports: [DisparoAgendamentoService],
})
export class DisparoAgendamentoModule {}