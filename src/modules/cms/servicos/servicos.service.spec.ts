import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Servico } from './servico.model.js';
import { ServicosService } from './servicos.service.js';

describe('ServicosService - issue #106', () => {
  let service: ServicosService;
  let state: Array<{ id: number; nome: string; ativo: boolean }>;
  let mockModel: {
    findAll: ReturnType<typeof vi.fn>;
    findByPk: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    state = [
      { id: 1, nome: 'Declaração IRPF', ativo: true },
      { id: 2, nome: 'Balancete', ativo: true },
      { id: 3, nome: 'Ajuste Fiscal', ativo: false },
    ];

    mockModel = {
      findAll: vi.fn(async (options: any = {}) => {
        const where = options?.where;
        if (where && 'ativo' in where) {
          return state.filter((item) => item.ativo === where.ativo);
        }
        return [...state];
      }),

      findByPk: vi.fn(async (id: number) => {
        const item = state.find((entry) => entry.id === id);
        if (!item) return null;

        // Clone raso que sera retornado ao service.
        // O update altera TANTO o clone (retorno) QUANTO o state (persistencia simulada).
        const clone: any = { ...item };
        clone.update = vi.fn(async (changes: any) => {
          Object.assign(item, changes);
          Object.assign(clone, changes);
          return clone;
        });

        return clone;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicosService,
        { provide: getModelToken(Servico), useValue: mockModel },
      ],
    }).compile();

    service = module.get<ServicosService>(ServicosService);
  });

  it('listarAtivos consulta apenas serviços com ativo: true', async () => {
    const result = await service.listarAtivos();

    expect(mockModel.findAll).toHaveBeenCalledWith({
      where: { ativo: true },
    });
    expect(result).toHaveLength(2);
    expect(result.every((item) => item.ativo === true)).toBe(true);
    expect(result.map((item) => item.id)).toEqual([1, 2]);
    expect(result).not.toContainEqual(
      expect.objectContaining({ id: 3, ativo: false }),
    );
  });

  it('atualizarStatus com ativo false remove o serviço do GET /servicos', async () => {
    const antes = await service.listarAtivos();
    expect(antes.map((item) => item.id)).toEqual([1, 2]);

    const atualizado = await service.atualizarStatus(1, { ativo: false });
    expect(atualizado.ativo).toBe(false);   // ← agora vai passar

    const depois = await service.listarAtivos();
    expect(depois.map((item) => item.id)).toEqual([2]);
    expect(depois.every((item) => item.ativo === true)).toBe(true);
  });
});