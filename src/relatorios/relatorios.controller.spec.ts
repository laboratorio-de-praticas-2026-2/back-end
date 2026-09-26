import { RelatoriosController } from './relatorios.controller.js';

describe('RelatoriosController', () => {
  it('deve colocar o relatório pendente e enviar para a fila', async () => {
    const adicionarGeracao = vi.fn().mockResolvedValue(undefined);
    const findUnique = vi.fn().mockResolvedValue({
      id: 1,
      status: 'gerado',
    });
    const update = vi.fn().mockResolvedValue({
      id: 1,
      status: 'pendente',
    });

    const producer = {
      adicionarGeracao,
    };

    const prisma = {
      relatorio: {
        findUnique,
        update,
      },
    };

    const controller = new RelatoriosController(
      producer as any,
      prisma as any,
      {} as any,
    );

    const resposta = await controller.gerarRelatorio({
      relatorioId: 1,
    });

    expect(findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
    });

    expect(update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        status: 'pendente',
      },
    });

    expect(adicionarGeracao).toHaveBeenCalledWith(1);

    expect(resposta).toEqual({
      mensagem: 'Job de geração de relatório enviado para a fila',
      relatorioId: 1,
      status: 'pendente',
    });
  });

  it('deve rejeitar relatorioId inválido', async () => {
    const adicionarGeracao = vi.fn();

    const controller = new RelatoriosController(
      {
        adicionarGeracao,
      } as any,
      {} as any,
      {} as any,
    );

    await expect(
      controller.gerarRelatorio({ relatorioId: 0 }),
    ).rejects.toThrow(
      'relatorioId deve ser um número inteiro positivo',
    );

    expect(adicionarGeracao).not.toHaveBeenCalled();
  });

  it('deve rejeitar relatório inexistente', async () => {
    const findUnique = vi.fn().mockResolvedValue(null);

    const controller = new RelatoriosController(
      {
        adicionarGeracao: vi.fn(),
      } as any,
      {
        relatorio: {
          findUnique,
        },
      } as any,
      {} as any,
    );

    await expect(
      controller.gerarRelatorio({ relatorioId: 999 }),
    ).rejects.toThrow('Relatório não encontrado');
  });

  it('deve buscar um relatório pelo ID', async () => {
    const relatorio = {
      id: 1,
      nome: 'Relatório teste',
      status: 'gerado',
    };

    const controller = new RelatoriosController(
      {
        adicionarGeracao: vi.fn(),
      } as any,
      {
        relatorio: {
          findUnique: vi.fn().mockResolvedValue(relatorio),
        },
      } as any,
      {} as any,
    );

    const resposta = await controller.buscarRelatorio('1');

    expect(resposta).toEqual(relatorio);
  });

  it('deve buscar o PDF de um relatório pelo ID', async () => {
    const controller = new RelatoriosController(
      {
        adicionarGeracao: vi.fn(),
      } as any,
      {
        relatorio: {
          findUnique: vi.fn().mockResolvedValue({
            id: 1,
            urlDocumentoHash:
              'https://res.cloudinary.com/teste/relatorio.pdf',
          }),
        },
      } as any,
      {} as any,
    );

    const resposta = await controller.buscarPdf('1');

    expect(resposta).toEqual({
      id: 1,
      url: 'https://res.cloudinary.com/teste/relatorio.pdf',
    });
  });

  it('deve rejeitar PDF inexistente', async () => {
    const controller = new RelatoriosController(
      {
        adicionarGeracao: vi.fn(),
      } as any,
      {
        relatorio: {
          findUnique: vi.fn().mockResolvedValue({
            id: 1,
            urlDocumentoHash: null,
          }),
        },
      } as any,
      {
        deletePdf: vi.fn(),
      } as any,
    );

    await expect(
      controller.buscarPdf('1'),
    ).rejects.toThrow('PDF do relatório não encontrado');
  });

  it('deve rejeitar exclusão de relatório inexistente', async () => {
    const controller = new RelatoriosController(
      {
        adicionarGeracao: vi.fn(),
      } as any,
      {
        relatorio: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
      } as any,
      {
        deletePdf: vi.fn(),
      } as any,
    );

    await expect(
      controller.excluirRelatorio('999'),
    ).rejects.toThrow('Relatório não encontrado');
  });

  it('deve excluir um relatório pelo ID e remover o PDF do Cloudinary', async () => {
    const deleteRelatorio = vi.fn().mockResolvedValue({});
    const findUnique = vi.fn().mockResolvedValue({
      id: 1,
      urlDocumentoHash:
        'https://res.cloudinary.com/teste/raw/upload/v123456/relatorios/relatorio.pdf',
    });

    const deletePdf = vi.fn().mockResolvedValue(undefined);

    const controller = new RelatoriosController(
      {
        adicionarGeracao: vi.fn(),
      } as any,
      {
        relatorio: {
          findUnique,
          delete: deleteRelatorio,
        },
      } as any,
      {
        deletePdf,
      } as any,
    );

    const resposta = await controller.excluirRelatorio('1');

    expect(deletePdf).toHaveBeenCalledWith(
      'relatorios/relatorio',
    );

    expect(deleteRelatorio).toHaveBeenCalledWith({
      where: { id: 1 },
    });

    expect(resposta).toEqual({
      mensagem: 'Relatório excluído com sucesso',
      id: 1,
    });
  });

  it('deve responder rapidamente após enviar o relatório para a fila', async () => {
    const adicionarGeracao = vi.fn().mockResolvedValue(undefined);

    const controller = new RelatoriosController(
      {
        adicionarGeracao,
      } as any,
      {
        relatorio: {
          findUnique: vi.fn().mockResolvedValue({
            id: 1,
            status: 'gerado',
          }),
          update: vi.fn().mockResolvedValue({
            id: 1,
            status: 'pendente',
          }),
        },
      } as any,
      {} as any,
    );

    const inicio = Date.now();

    const resposta = await controller.gerarRelatorio({
      relatorioId: 1,
    });

    const duracao = Date.now() - inicio;

    expect(adicionarGeracao).toHaveBeenCalledWith(1);
    expect(resposta.status).toBe('pendente');
    expect(duracao).toBeLessThan(1000);
  });
});