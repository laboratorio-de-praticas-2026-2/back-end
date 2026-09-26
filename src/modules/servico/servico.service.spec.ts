import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import { ServicoService } from './servico.service.js';
import { Servico } from './servico.js';
import { NotFoundException } from '@nestjs/common';

describe('ServicoService', () => {
  let service: ServicoService;
  let model: typeof Servico;

  const mockServico = {
    id: 1,
    titulo: 'Consultoria Contábil',
    descricao: 'Serviço de consultoria',
    icone: 'accounting.png',
    honorarios: 'Sob consulta',
    ativo: true,
  };

  const mockSequelizeModel = {
    create: vi.fn().mockResolvedValue(mockServico),
    findAll: vi.fn().mockResolvedValue([mockServico]),
    findByPk: vi.fn().mockResolvedValue({
      ...mockServico,
      update: vi.fn().mockResolvedValue({ ...mockServico, ativo: false }),
      destroy: vi.fn().mockResolvedValue(undefined),
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicoService,
        {
          provide: getModelToken(Servico),
          useValue: mockSequelizeModel,
        },
      ],
    }).compile();

    service = module.get<ServicoService>(ServicoService);
    model = module.get(getModelToken(Servico));
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('deve criar e retornar um novo serviço', async () => {
      const dto = {
        titulo: 'Consultoria Contábil',
        descricao: 'Serviço de consultoria',
        icone: 'accounting.png',
      };
      const result = await service.create(dto as any);
      expect(result).toEqual(mockServico);
      expect(model.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('deve retornar apenas serviços ativos por padrão', async () => {
      await service.findAll();
      expect(model.findAll).toHaveBeenCalledWith({ where: { ativo: true } });
    });

    it('deve retornar todos os serviços quando incluirInativos for true', async () => {
      await service.findAll(true);
      expect(model.findAll).toHaveBeenCalledWith();
    });
  });

  describe('findOne', () => {
    it('deve retornar um serviço por ID', async () => {
      const result = await service.findOne(1);
      expect(result).toEqual(expect.objectContaining({ id: 1 }));
    });

    it('deve lançar NotFoundException se o serviço não for encontrado', async () => {
      vi.spyOn(model, 'findByPk').mockResolvedValueOnce(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('deve atualizar um serviço', async () => {
      const result = await service.update(1, { ativo: false });
      expect(result).toBeDefined();
    });
  });

  describe('remove', () => {
    it('deve remover um serviço existente', async () => {
      await expect(service.remove(1)).resolves.not.toThrow();
    });
  });
});