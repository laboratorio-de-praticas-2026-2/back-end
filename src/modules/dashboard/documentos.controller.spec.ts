import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { DocumentosController } from './documentos.controller.js';
import { DocumentosService } from './documentos.service.js';
import { AdminGuard } from '../../commons/guards/admin.guard.js';

describe('DocumentosController', () => {
  let controller: DocumentosController;
  const service = { getIndicadores: vi.fn() };

  beforeEach(async () => {
    service.getIndicadores.mockReset();

    const module = await Test.createTestingModule({
      controllers: [DocumentosController],
      providers: [{ provide: DocumentosService, useValue: service }],
    }).compile();

    controller = module.get(DocumentosController);
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

  it('está protegido pelo AdminGuard', () => {
    expect(Reflect.getMetadata('__guards__', DocumentosController)).toContain(AdminGuard);
  });
});