import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { NotFoundException } from '@nestjs/common';
import { CloudinaryService } from '../../cloudinary/cloudinary.service.js';
import { RelatoriosService } from './relatorios.service.js';
import { Report } from '../../models/report.model.js';

describe('RelatoriosService', () => {
  let service: RelatoriosService;
  let reportModel: {
    findAll: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    findAndCountAll: ReturnType<typeof vi.fn>;
    findByPk: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  let cloudinary: { deletePdf: ReturnType<typeof vi.fn> };

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
            findByPk: vi.fn(),
            update: vi.fn(),
          },
        },
        {
          provide: CloudinaryService,
          useValue: { deletePdf: vi.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get<RelatoriosService>(RelatoriosService);
    reportModel = module.get(getModelToken(Report));
    cloudinary = module.get(CloudinaryService);
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

  it('calcula o total e o valor das parcelas com juros', () => {
    const result = service.simular({
      impostos: 1000,
      multas: 200,
      honorarios: 300,
      parcelas: 3,
      taxaJurosMensal: 10,
    });

    expect(result).toEqual({
      impostos: 1000,
      multas: 200,
      honorarios: 300,
      subtotal: 1500,
      parcelas: 3,
      taxaJurosMensal: 10,
      total: 1815,
      valorParcela: 605,
    });
  });

  it('considera pagamento a vista quando parcelas não é informado', () => {
    const result = service.simular({
      impostos: 100,
      multas: 50,
      honorarios: 25,
    });

    expect(result).toMatchObject({
      parcelas: 1,
      total: 175,
      valorParcela: 175,
    });
  });

  describe('consulta, PDF, status e exclusão', () => {
    const id = 'f2b25226-6efc-4cc9-82cf-b0ca79d79b8f';

    it('findOne retorna o relatório', async () => {
      reportModel.findByPk.mockResolvedValue({ id });

      expect(await service.findOne(id)).toEqual({ id });
      expect(reportModel.findByPk).toHaveBeenCalledWith(id);
    });

    it('findOne lança 404 quando não existe', async () => {
      reportModel.findByPk.mockResolvedValue(null);

      await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
    });

    it('findPdf retorna a URL quando o relatório está GERADO', async () => {
      reportModel.findByPk.mockResolvedValue({
        id,
        status: 'GERADO',
        arquivoUrl: 'https://res.cloudinary.com/x/raw/upload/v1/a.pdf',
      });

      expect(await service.findPdf(id)).toEqual({
        id,
        url: 'https://res.cloudinary.com/x/raw/upload/v1/a.pdf',
      });
    });

    it.each(['PENDENTE', 'FALHA'])(
      'findPdf lança 404 quando o status é %s',
      async (status) => {
        reportModel.findByPk.mockResolvedValue({ id, status, arquivoUrl: null });

        await expect(service.findPdf(id)).rejects.toThrow(NotFoundException);
      },
    );

    it('markPending zera a URL e volta o status para PENDENTE', async () => {
      const update = vi.fn().mockResolvedValue(undefined);
      reportModel.findByPk.mockResolvedValue({ id, update });

      await service.markPending(id);

      expect(update).toHaveBeenCalledWith({
        status: 'PENDENTE',
        arquivoUrl: null,
      });
    });

    it('markGenerated e markFailed atualizam o status', async () => {
      await service.markGenerated(id, 'https://x/a.pdf');
      await service.markFailed(id);

      expect(reportModel.update).toHaveBeenNthCalledWith(
        1,
        { status: 'GERADO', arquivoUrl: 'https://x/a.pdf' },
        { where: { id } },
      );
      expect(reportModel.update).toHaveBeenNthCalledWith(
        2,
        { status: 'FALHA' },
        { where: { id } },
      );
    });

    it('remove apaga o PDF no Cloudinary e depois o registro', async () => {
      const destroy = vi.fn().mockResolvedValue(undefined);
      reportModel.findByPk.mockResolvedValue({
        id,
        destroy,
        arquivoUrl:
          'https://res.cloudinary.com/demo/raw/upload/v1700000000/relatorios/a.pdf',
      });

      const result = await service.remove(id);

      expect(cloudinary.deletePdf).toHaveBeenCalledWith('relatorios/a.pdf');
      expect(destroy).toHaveBeenCalled();
      expect(result).toEqual({ mensagem: 'Relatório excluído com sucesso', id });
    });

    it('remove não chama o Cloudinary quando não há PDF', async () => {
      const destroy = vi.fn().mockResolvedValue(undefined);
      reportModel.findByPk.mockResolvedValue({ id, destroy, arquivoUrl: null });

      await service.remove(id);

      expect(cloudinary.deletePdf).not.toHaveBeenCalled();
      expect(destroy).toHaveBeenCalled();
    });

    it('remove preserva o registro se a exclusão no Cloudinary falhar', async () => {
      const destroy = vi.fn();
      reportModel.findByPk.mockResolvedValue({
        id,
        destroy,
        arquivoUrl: 'https://res.cloudinary.com/demo/raw/upload/v1/a.pdf',
      });
      cloudinary.deletePdf.mockRejectedValue(new Error('cloudinary fora'));

      await expect(service.remove(id)).rejects.toThrow('cloudinary fora');
      expect(destroy).not.toHaveBeenCalled();
    });

    it('remove lança 404 quando o relatório não existe', async () => {
      reportModel.findByPk.mockResolvedValue(null);

      await expect(service.remove(id)).rejects.toThrow(NotFoundException);
    });
  });
});
