import { describe, expect, it, vi } from 'vitest';
import { RelatoriosProducer } from './relatorios.producer.js';

describe('RelatoriosProducer', () => {
  it('deve adicionar o relatório na fila de geração', async () => {
    const add = vi.fn().mockResolvedValue(undefined);

    const queue = {
      add,
    };

    const producer = new RelatoriosProducer(queue as any);

    await producer.adicionarGeracao(10);

    expect(add).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenCalledWith('gerar-relatorio', {
      relatorioId: 10,
    });
  });
});