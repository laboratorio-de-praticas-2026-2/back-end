import { Test } from '@nestjs/testing';
import { FinanceiroController } from './financeiro.controller.js';
import { FinanceiroService } from './financeiro.service.js';

describe('FinanceiroController', () => {
  it('encaminha os filtros ao service e retorna a resposta', async () => {
    const resposta = { faturamentoRecebido: 100 };
    const service = {
      getDashboardFinanceiro: vi.fn().mockResolvedValue(resposta),
    };

    const module = await Test.createTestingModule({
      controllers: [FinanceiroController],
      providers: [
        { provide: FinanceiroService, useValue: service },
      ],
    }).compile();

    const controller = module.get(FinanceiroController);

    const resultado = await controller.getDashboardFinanceiro(
      '2026-09-01',
      '2026-09-30',
    );

    expect(service.getDashboardFinanceiro).toHaveBeenCalledWith(
      '2026-09-01',
      '2026-09-30',
    );
    expect(resultado).toEqual(resposta);
  });
});