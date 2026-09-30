import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { SolicitacoesController } from './solicitacoes.controller.js';
import { SolicitacoesService } from './solicitacoes.service.js';

describe('SolicitacoesController', () => {
  let controller: SolicitacoesController;
  const service = { getIndicadores: vi.fn() };

  beforeEach(async () => {
    service.getIndicadores.mockReset();

    const module = await Test.createTestingModule({
      controllers: [SolicitacoesController],
      providers: [{ provide: SolicitacoesService, useValue: service }],
    }).compile();

    controller = module.get(SolicitacoesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delega ao service repassando startDate e endDate', async () => {
    service.getIndicadores.mockResolvedValue({ ok: true });

    const resultado = await controller.getIndicadores('2026-09-01', '2026-09-30');

    expect(service.getIndicadores).toHaveBeenCalledWith('2026-09-01', '2026-09-30');
    expect(resultado).toEqual({ ok: true });
  });

  it('sem filtros repassa undefined (o service resolve o mês atual)', async () => {
    service.getIndicadores.mockResolvedValue({});

    await controller.getIndicadores();

    expect(service.getIndicadores).toHaveBeenCalledWith(undefined, undefined);
  });
});