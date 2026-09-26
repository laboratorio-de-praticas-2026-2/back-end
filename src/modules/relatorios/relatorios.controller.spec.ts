import { describe, expect, it, vi } from 'vitest';
import { RelatoriosController } from './relatorios.controller.js';

describe('RelatoriosController', () => {
  it('envia o PDF diretamente com os headers de preview', async () => {
    const pdf = Buffer.from('%PDF-test');
    const pdfGeneratorService = { gerar: vi.fn().mockResolvedValue(pdf) };
    const relatoriosService = { simular: vi.fn() };
    const response = {
      set: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };
    const dto = {
      titulo: 'Relatório financeiro',
      nomeCliente: 'Cliente de teste',
      itens: [{ descricao: 'Honorários', valor: 500, status: 'Pago' }],
    };
    const controller = new RelatoriosController(relatoriosService as never, pdfGeneratorService as never);

    await controller.preview(dto, response as never);

    expect(pdfGeneratorService.gerar).toHaveBeenCalledWith(dto);
    expect(response.set).toHaveBeenCalledWith({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline',
      'Content-Length': String(pdf.length),
    });
    expect(response.send).toHaveBeenCalledWith(pdf);
  });

  it('propaga o erro do gerador para o tratamento padrão do Nest', async () => {
    const error = new Error('Falha ao gerar PDF');
    const pdfGeneratorService = { gerar: vi.fn().mockRejectedValue(error) };
    const response = { set: vi.fn(), send: vi.fn() };
    const controller = new RelatoriosController({ simular: vi.fn() } as never, pdfGeneratorService as never);

    await expect(controller.preview({} as never, response as never)).rejects.toThrow(error);
    expect(response.send).not.toHaveBeenCalled();
  });
});