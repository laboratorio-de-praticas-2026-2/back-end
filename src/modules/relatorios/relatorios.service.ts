import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, WhereOptions } from 'sequelize';

import { Report } from '../../models/report.model.js';

import { CreateReportDto } from './dto/create-report.dto.js';
import { FindReportsDto } from './dto/find-reports.dto.js';
import { SimulacaoDto } from './dto/simulacao.dto.js';
import { SimuladorRegularizacaoFiscalDto } from './dto/simulador-regularizacao-fiscal.dto.js';
import { SimuladorRegularizacaoFiscalResponseDto } from './dto/simulador-regularizacao-fiscal-response.dto.js';

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

  simularRegularizacaoFiscal(
    dto: SimuladorRegularizacaoFiscalDto,
  ): SimuladorRegularizacaoFiscalResponseDto {
    try {
      if (!dto) {
        throw new BadRequestException('Dados da simulação são obrigatórios.');
      }

      this.validarValor('impostos', dto.impostos);
      this.validarValor('multas', dto.multas);
      this.validarValor('honorarios', dto.honorarios);

      const quantidadeParcelas = dto.quantidadeParcelas ?? 1;
      if (!Number.isInteger(quantidadeParcelas) || quantidadeParcelas < 1) {
        throw new BadRequestException(
          'quantidadeParcelas deve ser um número inteiro maior ou igual a 1.',
        );
      }

      const totalRegularizacao = dto.impostos + dto.multas + dto.honorarios;
      if (!Number.isFinite(totalRegularizacao)) {
        throw new BadRequestException(
          'O total da regularização deve ser um número finito.',
        );
      }

      const valorParcela = totalRegularizacao / quantidadeParcelas;
      if (!Number.isFinite(valorParcela)) {
        throw new BadRequestException(
          'O valor da parcela deve ser um número finito.',
        );
      }

      const resultado = {
        impostos: dto.impostos,
        multas: dto.multas,
        honorarios: dto.honorarios,
        totalRegularizacao,
        quantidadeParcelas,
        valorParcela,
      } satisfies SimuladorRegularizacaoFiscalResponseDto;

      this.validarResultado(resultado);
      return resultado;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Não foi possível processar a simulação de regularização fiscal.',
      );
    }
  }

  private validarValor(nome: string, valor: number): void {
    if (!Number.isFinite(valor) || valor < 0) {
      throw new BadRequestException(
        `${nome} deve ser um número finito maior ou igual a 0.`,
      );
    }
  }

  private validarResultado(
    resultado: SimuladorRegularizacaoFiscalResponseDto,
  ): void {
    const valores = [
      resultado.impostos,
      resultado.multas,
      resultado.honorarios,
      resultado.totalRegularizacao,
      resultado.quantidadeParcelas,
      resultado.valorParcela,
    ];

    if (
      valores.some((valor) => typeof valor !== 'number' || !Number.isFinite(valor))
    ) {
      throw new InternalServerErrorException(
        'O resultado da simulação é inválido.',
      );
    }

    if (
      resultado.totalRegularizacao !==
      resultado.impostos + resultado.multas + resultado.honorarios
    ) {
      throw new InternalServerErrorException(
        'O resultado da simulação é inconsistente.',
      );
    }
  }
}