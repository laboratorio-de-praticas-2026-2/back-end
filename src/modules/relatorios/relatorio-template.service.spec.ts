import { describe, expect, it } from 'vitest';
import { RelatorioTemplateService } from './relatorio-template.service.js';

describe('RelatorioTemplateService', () => {
  it('renderiza dados, estilos e conteúdo escapado no HTML', () => {
    const html = new RelatorioTemplateService().render({
      titulo: '<Relatório>',
      nomeCliente: 'Cliente & teste',
      itens: [{ descricao: 'Honorários', valor: 500, status: 'Pago' }],
    });

    expect(html).toContain('&lt;Relatório&gt;');
    expect(html).toContain('Cliente &amp; teste');
    expect(html).toContain('Honorários');
    expect(html).toContain('Pago');
    expect(html).toContain('R$ 500.00');
    expect(html).toContain('font-family: "Open Sans", sans-serif;');
    expect(html).toContain('@page { size: A4;');
    expect(html).toContain('table {');
  });

  it('renderiza períodos e descrições diferentes sem depender de conteúdo fixo', () => {
    const descricaoLonga = 'Processo '.repeat(80);
    const html = new RelatorioTemplateService().render({
      titulo: 'Relatório operacional',
      nomeCliente: 'Empresa exemplo',
      periodoInicio: '2025-01-01',
      periodoFim: '2025-12-31',
      itens: [
        { descricao: descricaoLonga, valor: 1250.5, status: 'Em andamento' },
        { descricao: 'Regularização fiscal', valor: 750, status: 'Concluído' },
      ],
    });

    expect(html).toContain('Relatório operacional');
    expect(html).toContain('2025-01-01 a 2025-12-31');
    expect(html).toContain(descricaoLonga);
    expect(html).toContain('break-inside: avoid');
    expect(html).toContain('overflow-wrap: anywhere');
    expect(html).toContain('Regularização fiscal');
  });

  it('preserva os caracteres acentuados do português brasileiro', () => {
    const acentos = 'á à â ã é ê í ó ô õ ú ç Á À Â Ã É Ê Í Ó Ô Õ Ú Ç';
    const html = new RelatorioTemplateService().render({
      titulo: acentos,
      nomeCliente: acentos,
      itens: [{ descricao: acentos, valor: 1, status: acentos }],
    });

    expect(html).toContain(acentos);
    expect(html).toContain('<meta charset="UTF-8">');
  });
});