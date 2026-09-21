import { RelatoriosController } from './relatorios.controller.js';

describe('RelatoriosController', () => {
  it('deve enviar o relatório para a fila', async () => {
    const adicionarGeracao = vi.fn();

    const producer = {
      adicionarGeracao,
    };

    const controller = new RelatoriosController(producer as any);

    const resposta = await controller.gerarRelatorio({
      relatorioId: 1,
    });

    expect(adicionarGeracao).toHaveBeenCalledWith(1);

    expect(resposta).toEqual({
      mensagem: 'Job de geração de relatório enviado para a fila',
    });
  });

  it('deve buscar um relatório pelo ID', async () => {
    const controller = new RelatoriosController({
      adicionarGeracao: vi.fn(),
    } as any);

    const resposta = await controller.buscarRelatorio('1');

    expect(resposta).toEqual({
      id: 1,
    });
  });

  it('deve buscar o PDF de um relatório pelo ID', async () => {
    const controller = new RelatoriosController({
      adicionarGeracao: vi.fn(),
    } as any);

    const resposta = await controller.buscarPdf('1');

    expect(resposta).toEqual({
      id: 1,
      mensagem: 'PDF do relatório',
    });
  });

  it('deve excluir um relatório pelo ID', async () => {
    const controller = new RelatoriosController({
      adicionarGeracao: vi.fn(),
    } as any);

    const resposta = await controller.excluirRelatorio('1');

    expect(resposta).toEqual({
      id: 1,
      mensagem: 'Relatório excluído',
    });
  });
});