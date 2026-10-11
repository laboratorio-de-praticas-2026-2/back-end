import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { NotificacaoObrigacoesService } from '../services/notificacao-obrigacoes.service.js';

@Injectable()
export class NotificacaoObrigacoesCron {
  private readonly logger = new Logger(NotificacaoObrigacoesCron.name);

  constructor(
    private readonly service: NotificacaoObrigacoesService,
  ) {}

  /**
   * Executa toda segunda-feira às 08:00 (horário de São Paulo).
   * dia-semana: 1 = segunda-feira
   */
  @Cron('0 0 8 * * 1', {
    name: 'notificacao-obrigacoes-semanal',
    timeZone: 'America/Sao_Paulo',
  })
  async executar(): Promise<void> {
    this.logger.log('Cron semanal disparado (segunda-feira).');
    await this.service.executarRotinaSemanal();
  }
}