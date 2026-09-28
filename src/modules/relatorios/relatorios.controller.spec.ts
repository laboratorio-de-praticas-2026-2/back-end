import { Test, TestingModule } from '@nestjs/testing';
import { RelatoriosController } from './relatorios.controller.js';
import { RelatoriosService } from './relatorios.service.js';

describe('RelatoriosController', () => {
  let controller: RelatoriosController;
  let service: {
    create: ReturnType<typeof vi.fn>;
    findCategories: ReturnType<typeof vi.fn>;
    findAll: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RelatoriosController],
      providers: [
        {
          provide: RelatoriosService,
          useValue: {
            create: vi.fn(),
            findCategories: vi.fn(),
            findAll: vi.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<RelatoriosController>(RelatoriosController);
    service = module.get(RelatoriosService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a report', async () => {
    const data = {
      nome: 'Relatório Financeiro',
      categoria: 'Financeiro',
      descricao: 'Relatório financeiro mensal',
      data_inicio: '2026-09-01',
      data_termino: '2026-09-30',
    };

    const createdReport = {
      id: 'f2b25226-6efc-4cc9-82cf-b0ca79d79b8f',
      ...data,
      status: 'PENDENTE',
      arquivoUrl: null,
    };

    service.create.mockResolvedValue(createdReport);

    const result = await controller.create(data);

    expect(result).toEqual(createdReport);
    expect(service.create).toHaveBeenCalledWith(data);
  });

  it('should return report categories', async () => {
    const categories = ['Financeiro', 'Fiscal', 'Contábil'];

    service.findCategories.mockResolvedValue(categories);

    const result = await controller.findCategories();

    expect(result).toEqual(categories);
    expect(service.findCategories).toHaveBeenCalledWith();
  });

  it('should return reports with filters', async () => {
    const filters = {
      nome: 'Financeiro',
      categoria: 'Financeiro',
      status: 'PENDENTE' as const,
      data_inicio: '2026-09-01',
      data_termino: '2026-09-30',
      page: 1,
      limit: 10,
    };

    const response = {
      dados: [
        {
          id: 'f2b25226-6efc-4cc9-82cf-b0ca79d79b8f',
          nome: 'Relatório Financeiro',
          categoria: 'Financeiro',
          status: 'PENDENTE',
        },
      ],
      total: 1,
      pagina: 1,
      limite: 10,
    };

    service.findAll.mockResolvedValue(response);

    const result = await controller.findAll(filters);

    expect(result).toEqual(response);
    expect(service.findAll).toHaveBeenCalledWith(filters);
  });
});
