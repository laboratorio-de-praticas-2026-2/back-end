import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, WhereOptions } from 'sequelize';

import { Report } from '../../models/report.model.js';
import { CloudinaryService } from '../../cloudinary/cloudinary.service.js';

import { CreateReportDto } from './dto/create-report.dto.js';
import { FindReportsDto } from './dto/find-reports.dto.js';
import { SimulacaoDto } from './dto/simulacao.dto.js';

@Injectable()
export class RelatoriosService {
  private readonly logger = new Logger(RelatoriosService.name);

  constructor(
    @InjectModel(Report)
    private readonly reportModel: typeof Report,
    private readonly cloudinaryService: CloudinaryService,
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

  async findOne(id: string): Promise<Report> {
    const report = await this.reportModel.findByPk(id);

    if (!report) {
      throw new NotFoundException('Relatório não encontrado');
    }

    return report;
  }

  /** Retorna a URL real do PDF; só existe quando o status é GERADO. */
  async findPdf(id: string): Promise<{ id: string; url: string }> {
    const report = await this.findOne(id);

    if (report.status !== 'GERADO' || !report.arquivoUrl) {
      throw new NotFoundException('PDF do relatório ainda não foi gerado');
    }

    return { id: report.id, url: report.arquivoUrl };
  }

  /** Volta o relatório para PENDENTE antes de (re)enfileirar a geração. */
  async markPending(id: string): Promise<Report> {
    const report = await this.findOne(id);

    await report.update({ status: 'PENDENTE', arquivoUrl: null });

    return report;
  }

  async markGenerated(id: string, arquivoUrl: string): Promise<void> {
    await this.reportModel.update(
      { status: 'GERADO', arquivoUrl },
      { where: { id } },
    );
  }

  async markFailed(id: string): Promise<void> {
    await this.reportModel.update({ status: 'FALHA' }, { where: { id } });
  }

  async remove(id: string): Promise<{ mensagem: string; id: string }> {
    const report = await this.findOne(id);

    if (report.arquivoUrl) {
      const publicId = this.extractCloudinaryPublicId(report.arquivoUrl);

      if (publicId) {
        await this.cloudinaryService.deletePdf(publicId);
      } else {
        this.logger.warn(
          `Não foi possível identificar o arquivo no Cloudinary para o relatório ${id}`,
        );
      }
    }

    await report.destroy();

    return { mensagem: 'Relatório excluído com sucesso', id };
  }

  private extractCloudinaryPublicId(url: string): string | null {
    try {
      const partes = new URL(url).pathname.split('/').filter(Boolean);
      const uploadIndex = partes.indexOf('upload');

      if (uploadIndex === -1) {
        return null;
      }

      return partes
        .slice(uploadIndex + 1)
        .filter((parte) => !/^v\d+$/.test(parte))
        .join('/');
    } catch {
      return null;
    }
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

  async downloadPdf(url: string): Promise<Buffer> {
    try {
      return await this.cloudinaryService.downloadPdf(url);
    } catch (error) {
      this.logger.error('Falha ao baixar PDF do Cloudinary', error);
      throw error;
    }
  }
}