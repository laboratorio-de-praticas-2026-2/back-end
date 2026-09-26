import { Test, TestingModule } from '@nestjs/testing';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import { ServicoController } from './servico.controller.js';
import { ServicoService } from './servico.service.js';

describe('ServicoController', () => {
  let controller: ServicoController;
  let service: ServicoService;

  const mockServico = {
    id: 1,
    titulo: 'Abertura de Empresa',
    descricao: 'Processo completo de abertura',
    icone: 'business.png',
    honorarios: 'R$ 1.200,00',
    ativo: true,
  };

  const mockServicoService = {
    create: vi.fn().mockResolvedValue(mockServico),
    findAll: vi.fn().mockResolvedValue([mockServico]),
    findOne: vi.fn().mockResolvedValue(mockServico),
    update: vi.fn().mockResolvedValue({ ...mockServico, ativo: false }),
    remove: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServicoController],
      providers: [
        {
          provide: ServicoService,
          useValue: mockServicoService,
        },
      ],
    }).compile();

    controller = module.get<ServicoController>(ServicoController);
    service = module.get<ServicoService>(ServicoService);
  });

  it('deve estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('deve chamar create no service ao criar serviço', async () => {
    const dto = {
      titulo: 'Abertura de Empresa',
      descricao: 'Processo completo de abertura',
      icone: 'business.png',
    };
    await controller.create(dto as any);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('deve chamar findAll sem inativos por padrão', async () => {
    await controller.findAll();
    expect(service.findAll).toHaveBeenCalledWith(false);
  });

  it('deve chamar findAll com inativos quando passar query param', async () => {
    await controller.findAll('true');
    expect(service.findAll).toHaveBeenCalledWith(true);
  });

  it('deve buscar um serviço por ID', async () => {
    await controller.findOne(1);
    expect(service.findOne).toHaveBeenCalledWith(1);
  });

  it('deve atualizar um serviço', async () => {
    await controller.update(1, { ativo: false });
    expect(service.update).toHaveBeenCalledWith(1, { ativo: false });
  });

  it('deve remover um serviço', async () => {
    await controller.remove(1);
    expect(service.remove).toHaveBeenCalledWith(1);
  });
});