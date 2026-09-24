
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { RelatoriosService } from './relatorios.service.js';
import { Report } from '../../models/report.model.js';

describe('RelatoriosService', () => {
  let service: RelatoriosService;
  let reportModel: {
    findAll: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    findAndCountAll: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RelatoriosService,
        {
          provide: getModelToken(Report),
          useValue: {
            findAll: vi.fn(),
            create: vi.fn(),
            findAndCountAll: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RelatoriosService>(RelatoriosService);
    reportModel = module.get(getModelToken(Report));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return report categories', async () => {
    reportModel.findAll.mockResolvedValue([
      { categoria: 'Financeiro' },
      { categoria: 'Fiscal' },
      { categoria: 'Contábil' },
    ]);

    const result = await service.findCategories();

    expect(result).toEqual(['Financeiro', 'Fiscal', 'Contábil']);

    expect(reportModel.findAll).toHaveBeenCalledWith({
      attributes: ['categoria'],
      group: ['categoria'],
      order: [['categoria', 'ASC']],
    });
  });

  it('should create a report with pending status', async () => {
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

    reportModel.create.mockResolvedValue(createdReport);

    const result = await service.create(data);

    expect(result).toEqual(createdReport);

    expect(reportModel.create).toHaveBeenCalledWith({
      nome: data.nome,
      categoria: data.categoria,
      descricao: data.descricao,
      dataInicio: new Date(data.data_inicio),
      dataTermino: new Date(data.data_termino),
    });
  });

  it('should return reports with pagination', async () => {
    const reports = [
      {
        id: '1',
        nome: 'Relatório Financeiro',
        categoria: 'Financeiro',
        status: 'PENDENTE',
      },
    ];

    reportModel.findAndCountAll.mockResolvedValue({
      rows: reports,
      count: 1,
    });

    const result = await service.findAll({
      page: 1,
      limit: 10,
    });

    expect(result).toEqual({
      dados: reports,
      total: 1,
      pagina: 1,
      limite: 10,
    });

    expect(reportModel.findAndCountAll).toHaveBeenCalledWith({
      where: {},
      limit: 10,
      offset: 0,
      order: [['data_inicio', 'DESC']],
    });
  });

  it('should filter reports by name', async () => {
    reportModel.findAndCountAll.mockResolvedValue({
      rows: [],
      count: 0,
    });

    await service.findAll({
      nome: 'Financeiro',
      page: 1,
      limit: 10,
    });

    expect(reportModel.findAndCountAll).toHaveBeenCalledWith({
      where: {
        nome: {
          [Op.like]: '%Financeiro%',
        },
      },
      limit: 10,
      offset: 0,
      order: [['data_inicio', 'DESC']],
    });
  });

  it('should filter reports by category', async () => {
    reportModel.findAndCountAll.mockResolvedValue({
      rows: [],
      count: 0,
    });

    await service.findAll({
      categoria: 'Financeiro',
      page: 1,
      limit: 10,
    });

    expect(reportModel.findAndCountAll).toHaveBeenCalledWith({
      where: {
        categoria: 'Financeiro',
      },
      limit: 10,
      offset: 0,
      order: [['data_inicio', 'DESC']],
    });
  });

  it('should filter reports by status', async () => {
    reportModel.findAndCountAll.mockResolvedValue({
      rows: [],
      count: 0,
    });

    await service.findAll({
      status: 'PENDENTE',
      page: 1,
      limit: 10,
    });

    expect(reportModel.findAndCountAll).toHaveBeenCalledWith({
      where: {
        status: 'PENDENTE',
      },
      limit: 10,
      offset: 0,
      order: [['data_inicio', 'DESC']],
    });
  });

  it('should filter reports by date interval', async () => {
    reportModel.findAndCountAll.mockResolvedValue({
      rows: [],
      count: 0,
    });

    await service.findAll({
      data_inicio: '2026-09-01',
      data_termino: '2026-09-30',
      page: 1,
      limit: 10,
    });

    expect(reportModel.findAndCountAll).toHaveBeenCalledWith({
      where: {
        dataInicio: {
          [Op.gte]: new Date('2026-09-01'),
          [Op.lte]: new Date('2026-09-30'),
        },
      },
      limit: 10,
      offset: 0,
      order: [['data_inicio', 'DESC']],
    });
  });

  it('should apply pagination correctly', async () => {
    reportModel.findAndCountAll.mockResolvedValue({
      rows: [],
      count: 25,
    });

    const result = await service.findAll({
      page: 3,
      limit: 5,
    });

    expect(result).toEqual({
      dados: [],
      total: 25,
      pagina: 3,
      limite: 5,
    });

    expect(reportModel.findAndCountAll).toHaveBeenCalledWith({
      where: {},
      limit: 5,
      offset: 10,
      order: [['data_inicio', 'DESC']],
    });
  });

  it('should apply combined filters', async () => {
    reportModel.findAndCountAll.mockResolvedValue({
      rows: [],
      count: 0,
    });

    await service.findAll({
      nome: 'Financeiro',
      categoria: 'Financeiro',
      status: 'PENDENTE',
      data_inicio: '2026-09-01',
      data_termino: '2026-09-30',
      page: 2,
      limit: 5,
    });

    expect(reportModel.findAndCountAll).toHaveBeenCalledWith({
      where: {
        nome: {
          [Op.like]: '%Financeiro%',
        },
        categoria: 'Financeiro',
        status: 'PENDENTE',
        dataInicio: {
          [Op.gte]: new Date('2026-09-01'),
          [Op.lte]: new Date('2026-09-30'),
        },
      },
      limit: 5,
      offset: 5,
      order: [['data_inicio', 'DESC']],
    });
  });

  it('should return an empty list when no reports are found', async () => {
    reportModel.findAndCountAll.mockResolvedValue({
      rows: [],
      count: 0,
    });

    const result = await service.findAll({
      nome: 'Relatório inexistente',
      page: 1,
      limit: 10,
    });

    expect(result).toEqual({
      dados: [],
      total: 0,
      pagina: 1,
      limite: 10,
    });
  });
});

