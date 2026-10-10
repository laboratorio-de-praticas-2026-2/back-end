import { describe, expect, it, vi } from 'vitest';
import { RelatoriosProducer } from './relatorios.producer.js';

describe('RelatoriosProducer', () => {
  it('deve adicionar o relatório na fila de geração', async () => {
    const add = vi.fn().mockResolvedValue(undefined);

    const queue = {
      add,
    };

    const producer = new RelatoriosProducer(queue as any);

    const relatorioId = 'f2b25226-6efc-4cc9-82cf-b0ca79d79b8f';

    await producer.adicionarGeracao(relatorioId);

    expect(add).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenCalledWith('gerar-relatorio', {
      relatorioId,
    });
  });
});