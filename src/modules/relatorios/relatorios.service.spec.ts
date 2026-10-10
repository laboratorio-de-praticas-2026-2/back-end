import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { Op } from 'sequelize';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Report } from '../../models/report.model.js';
import { CloudinaryService } from '../../cloudinary/cloudinary.service.js';

import { RelatoriosService } from './relatorios.service.js';

describe('RelatoriosService', () => {
  let service: RelatoriosService;

  const createReportModel = () => ({
    create: vi.fn(),
    findByPk: vi.fn(),
    findAll: vi.fn(),
    findAndCountAll: vi.fn(),
  });

  const createCloudinaryService = () => ({
    uploadPdf: vi.fn(),
    deletePdf: vi.fn(),
  });

  let reportModel: ReturnType<typeof createReportModel>;
  let cloudinaryService: ReturnType<typeof createCloudinaryService>;

  beforeEach(async () => {
    reportModel = createReportModel();
    cloudinaryService = createCloudinaryService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RelatoriosService,
        {
          provide: getModelToken(Report),
          useValue: reportModel,
        },
        {
          provide: CloudinaryService,
          useValue: cloudinaryService,
        },
      ],
    }).compile();

    service = module.get<RelatoriosService>(RelatoriosService);
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  it('deve listar as categorias disponíveis', async () => {
    reportModel.findAll.mockResolvedValue([
      { categoria: 'Financeiro' },
      { categoria: 'Jurídico' },
      { categoria: 'Tributário' },
    ]);

    const result = await service.findCategories();

    expect(reportModel.findAll).toHaveBeenCalledWith({
      attributes: ['categoria'],
      group: ['categoria'],
      order: [['categoria', 'ASC']],
    });

    expect(result).toEqual([
      'Financeiro',
      'Jurídico',
      'Tributário',
    ]);
  });

  it('deve criar um relatório com status PENDENTE', async () => {
    const createdReport = {
      id: 'fa1342e6-3c0d-4048-98ff-c5111e5b2647',
      nome: 'Relatório Financeiro',
      categoria: 'Financeiro',
      descricao: 'Relatório de teste',
      dataInicio: new Date('2026-09-01'),
      dataTermino: new Date('2026-09-30'),
      status: 'PENDENTE',
    };

    reportModel.create.mockResolvedValue(createdReport);

    const result = await service.create({
      nome: 'Relatório Financeiro',
      categoria: 'Financeiro',
      descricao: 'Relatório de teste',
      data_inicio: '2026-09-01',
      data_termino: '2026-09-30',
    });

    expect(reportModel.create).toHaveBeenCalledWith({
      nome: 'Relatório Financeiro',
      categoria: 'Financeiro',
      descricao: 'Relatório de teste',
      dataInicio: expect.any(Date),
      dataTermino: expect.any(Date),
    });

    expect(result).toEqual(createdReport);
  });

  it('deve listar relatórios com paginação', async () => {
    const rows = [
      { id: '1', nome: 'Relatório 1' },
      { id: '2', nome: 'Relatório 2' },
    ];

    reportModel.findAndCountAll.mockResolvedValue({
      rows,
      count: 5,
    });

    const result = await service.findAll({
      page: 1,
      limit: 2,
    });

    expect(reportModel.findAndCountAll).toHaveBeenCalledWith({
      where: {},
      limit: 2,
      offset: 0,
      order: [['data_inicio', 'DESC']],
    });

    expect(result).toEqual({
      dados: rows,
      total: 5,
      pagina: 1,
      limite: 2,
      temProximaPagina: true,
    });
  });

  it('deve filtrar por nome parcialmente', async () => {
    reportModel.findAndCountAll.mockResolvedValue({
      rows: [],
      count: 0,
    });

    await service.findAll({
      nome: 'Financeiro',
      page: 1,
      limit: 10,
    });

    expect(reportModel.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          nome: {
            [Op.like]: '%Financeiro%',
          },
        },
        limit: 10,
        offset: 0,
        order: [['data_inicio', 'DESC']],
      }),
    );
  });

  it('deve filtrar por categoria', async () => {
    reportModel.findAndCountAll.mockResolvedValue({
      rows: [],
      count: 0,
    });

    await service.findAll({
      categoria: 'Financeiro',
      page: 1,
      limit: 10,
    });

    expect(reportModel.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          categoria: 'Financeiro',
        },
      }),
    );
  });

  it('deve filtrar por status', async () => {
    reportModel.findAndCountAll.mockResolvedValue({
      rows: [],
      count: 0,
    });

    await service.findAll({
      status: 'GERADO',
      page: 1,
      limit: 10,
    });

    expect(reportModel.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: 'GERADO',
        },
      }),
    );
  });

  it('deve filtrar por intervalo de datas', async () => {
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

    expect(reportModel.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          dataInicio: {
            [Op.gte]: expect.any(Date),
            [Op.lte]: expect.any(Date),
          },
        },
      }),
    );
  });

  it('deve calcular corretamente a paginação', async () => {
    reportModel.findAndCountAll.mockResolvedValue({
      rows: [{ id: '3' }],
      count: 10,
    });

    const result = await service.findAll({
      page: 3,
      limit: 3,
    });

    expect(reportModel.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 3,
        offset: 6,
      }),
    );

    expect(result.pagina).toBe(3);
    expect(result.limite).toBe(3);
    expect(result.total).toBe(10);
  });

  it('deve indicar quando existe próxima página', async () => {
    reportModel.findAndCountAll.mockResolvedValue({
      rows: [{ id: '1' }, { id: '2' }],
      count: 5,
    });

    const result = await service.findAll({
      page: 1,
      limit: 2,
    });

    expect(result.temProximaPagina).toBe(true);
  });

  it('não deve indicar próxima página quando estiver na última página', async () => {
    reportModel.findAndCountAll.mockResolvedValue({
      rows: [{ id: '5' }],
      count: 5,
    });

    const result = await service.findAll({
      page: 3,
      limit: 2,
    });

    expect(result.temProximaPagina).toBe(false);
  });

  it('deve aplicar múltiplos filtros ao mesmo tempo', async () => {
    reportModel.findAndCountAll.mockResolvedValue({
      rows: [],
      count: 0,
    });

    await service.findAll({
      nome: 'Financeiro',
      categoria: 'Financeiro',
      status: 'GERADO',
      data_inicio: '2026-09-01',
      data_termino: '2026-09-30',
      page: 2,
      limit: 5,
    });

    expect(reportModel.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          nome: {
            [Op.like]: '%Financeiro%',
          },
          categoria: 'Financeiro',
          status: 'GERADO',
          dataInicio: {
            [Op.gte]: expect.any(Date),
            [Op.lte]: expect.any(Date),
          },
        },
        limit: 5,
        offset: 5,
      }),
    );
  });

  it('deve retornar lista vazia quando não houver resultados', async () => {
    reportModel.findAndCountAll.mockResolvedValue({
      rows: [],
      count: 0,
    });

    const result = await service.findAll({
      page: 1,
      limit: 10,
    });

    expect(result).toEqual({
      dados: [],
      total: 0,
      pagina: 1,
      limite: 10,
      temProximaPagina: false,
    });
  });

  it('deve buscar um relatório pelo ID', async () => {
    const report = {
      id: 'fa1342e6-3c0d-4048-98ff-c5111e5b2647',
      nome: 'Relatório Financeiro',
      status: 'PENDENTE',
    };

    reportModel.findByPk.mockResolvedValue(report);

    const result = await service.findById(report.id);

    expect(reportModel.findByPk).toHaveBeenCalledWith(report.id);
    expect(result).toEqual(report);
  });

  it('deve lançar 404 quando o relatório não existir', async () => {
    reportModel.findByPk.mockResolvedValue(null);

    await expect(
      service.findById(
        'fa1342e6-3c0d-4048-98ff-c5111e5b2647',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deve atualizar o status do relatório', async () => {
    const report = {
      id: 'fa1342e6-3c0d-4048-98ff-c5111e5b2647',
      status: 'PENDENTE',
      update: vi.fn().mockImplementation(async ({ status }) => {
        report.status = status;
        return report;
      }),
    };

    reportModel.findByPk.mockResolvedValue(report);

    const result = await service.updateStatus(report.id, 'GERADO');

    expect(report.update).toHaveBeenCalledWith({
      status: 'GERADO',
    });

    expect(result.status).toBe('GERADO');
  });

  it('deve excluir o PDF do Cloudinary antes de excluir o relatório', async () => {
    const report = {
      id: 'fa1342e6-3c0d-4048-98ff-c5111e5b2647',
      arquivoUrl:
        'https://res.cloudinary.com/demo/raw/upload/v123456789/relatorios/teste.pdf',
      destroy: vi.fn().mockResolvedValue(undefined),
    };

    reportModel.findByPk.mockResolvedValue(report);
    cloudinaryService.deletePdf.mockResolvedValue(undefined);

    await service.delete(report.id);

    expect(cloudinaryService.deletePdf).toHaveBeenCalledWith(
      'relatorios/teste.pdf',
    );

    expect(report.destroy).toHaveBeenCalled();

    expect(
      cloudinaryService.deletePdf.mock.invocationCallOrder[0],
    ).toBeLessThan(report.destroy.mock.invocationCallOrder[0]);
  });

  it('não deve excluir o relatório se a exclusão no Cloudinary falhar', async () => {
    const report = {
      id: 'fa1342e6-3c0d-4048-98ff-c5111e5b2647',
      arquivoUrl:
        'https://res.cloudinary.com/demo/raw/upload/v123456789/relatorios/teste.pdf',
      destroy: vi.fn().mockResolvedValue(undefined),
    };

    const cloudinaryError = new Error(
      'Falha ao excluir arquivo no Cloudinary',
    );

    reportModel.findByPk.mockResolvedValue(report);
    cloudinaryService.deletePdf.mockRejectedValue(
      cloudinaryError,
    );

    await expect(
      service.delete(report.id),
    ).rejects.toThrow(
      'Falha ao excluir arquivo no Cloudinary',
    );

    expect(report.destroy).not.toHaveBeenCalled();
  });

  it('deve propagar erro do banco ao listar relatórios', async () => {
    const databaseError = new Error(
      'Falha de conexão com o banco de dados',
    );

    reportModel.findAndCountAll.mockRejectedValue(
      databaseError,
    );

    await expect(
      service.findAll({
        page: 1,
        limit: 10,
      }),
    ).rejects.toThrow(
      'Falha de conexão com o banco de dados',
    );

    expect(reportModel.findAndCountAll).toHaveBeenCalled();
  });

  it('deve calcular corretamente uma simulação com juros', () => {
    const result = service.simular({
      impostos: 100,
      multas: 50,
      honorarios: 150,
      parcelas: 3,
      taxaJurosMensal: 10,
    });

    expect(result.subtotal).toBe(300);
    expect(result.parcelas).toBe(3);
    expect(result.taxaJurosMensal).toBe(10);
    expect(result.total).toBe(363);
    expect(result.valorParcela).toBe(121);
  });

  it('deve calcular corretamente uma simulação à vista', () => {
    const result = service.simular({
      impostos: 100,
      multas: 50,
      honorarios: 150,
    });

    expect(result.subtotal).toBe(300);
    expect(result.parcelas).toBe(1);
    expect(result.taxaJurosMensal).toBe(0);
    expect(result.total).toBe(300);
    expect(result.valorParcela).toBe(300);
  });
});