import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, WhereOptions } from 'sequelize';

import { Report } from '../../models/report.model.js';

import { CreateReportDto } from './dto/create-report.dto.js';
import { FindReportsDto } from './dto/find-reports.dto.js';
import { SimulacaoDto } from './dto/simulacao.dto.js';

@Injectable()
export class RelatoriosService {
  constructor(
    @InjectModel(Report)
    private readonly reportModel: typeof Report,
  ) {}

  async create(data: CreateReportDto) {
    return this.reportModel.create({
      nome: data.nome,
      categoria: data.categoria,
      descricao: data.descricao,
      dataInicio: new Date(data.data_inicio),
      dataTermino: new Date(data.data_termino),
    });
  }

  async findCategories() {
    const reports = await this.reportModel.findAll({
      attributes: ['categoria'],
      group: ['categoria'],
      order: [['categoria', 'ASC']],
    });

    return reports.map((report) => report.categoria);
  }

  async findAll(filters: FindReportsDto) {
    const {
      nome,
      categoria,
      status,
      data_inicio,
      data_termino,
      page = 1,
      limit = 10,
    } = filters;

    const where: WhereOptions<Report> = {};

    if (nome) {
      where.nome = {
        [Op.like]: `%${nome}%`,
      };
    }

    if (categoria) {
      where.categoria = categoria;
    }

    if (status) {
      where.status = status;
    }

    if (data_inicio || data_termino) {
      where.dataInicio = {
        ...(data_inicio && {
          [Op.gte]: new Date(data_inicio),
        }),
        ...(data_termino && {
          [Op.lte]: new Date(data_termino),
        }),
      };
    }

    const offset = (page - 1) * limit;

    const { rows, count } = await this.reportModel.findAndCountAll({
      where,
      limit,
      offset,
      order: [['data_inicio', 'DESC']],
    });

    return {
      dados: rows,
      total: count,
      pagina: page,
      limite: limit,
    };
  }

  simular(dto: SimulacaoDto) {
    const subtotal = dto.impostos + dto.multas + dto.honorarios;
    const parcelas = dto.parcelas ?? 1;
    const taxa = dto.taxaJurosMensal ?? 0;
    const total =
      subtotal * Math.pow(1 + taxa / 100, parcelas - 1);

    return {
      impostos: dto.impostos,
      multas: dto.multas,
      honorarios: dto.honorarios,
      subtotal,
      parcelas,
      taxaJurosMensal: taxa,
      total: Number(total.toFixed(2)),
      valorParcela: Number((total / parcelas).toFixed(2)),
    };
  }
}