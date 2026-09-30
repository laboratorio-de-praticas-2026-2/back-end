import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class RelatoriosProducer {
  constructor(
    @InjectQueue('relatorios')
    private readonly relatoriosQueue: Queue,
  ) {}

  async adicionarGeracao(relatorioId: number) {
    await this.relatoriosQueue.add('gerar-relatorio', {
      relatorioId,
    });
  }
}