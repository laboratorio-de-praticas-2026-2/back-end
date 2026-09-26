import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  NotFoundException,
} from '@nestjs/common';
import { RelatoriosProducer } from './relatorios.producer.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';

@Controller('relatorios')
export class RelatoriosController {
  constructor(
    private readonly relatoriosProducer: RelatoriosProducer,
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post('generate')
  async gerarRelatorio(@Body() body: { relatorioId: number }) {
    if (
      typeof body?.relatorioId !== 'number' ||
      !Number.isInteger(body.relatorioId) ||
      body.relatorioId <= 0
    ) {
      throw new BadRequestException(
        'relatorioId deve ser um número inteiro positivo',
      );
    }

    const relatorio = await this.prisma.relatorio.findUnique({
      where: { id: body.relatorioId },
    });

    if (!relatorio) {
      throw new NotFoundException('Relatório não encontrado');
    }

    await this.prisma.relatorio.update({
      where: { id: body.relatorioId },
      data: {
        status: 'pendente',
      },
    });

    await this.relatoriosProducer.adicionarGeracao(body.relatorioId);

    return {
      mensagem: 'Job de geração de relatório enviado para a fila',
      relatorioId: body.relatorioId,
      status: 'pendente',
    };
  }

  @Get(':id')
  async buscarRelatorio(@Param('id') id: string) {
    const relatorioId = Number(id);

    if (!Number.isInteger(relatorioId) || relatorioId <= 0) {
      throw new BadRequestException('ID do relatório inválido');
    }

    const relatorio = await this.prisma.relatorio.findUnique({
      where: { id: relatorioId },
    });

    if (!relatorio) {
      throw new NotFoundException('Relatório não encontrado');
    }

    return relatorio;
  }

  @Get(':id/pdf')
  async buscarPdf(@Param('id') id: string) {
    const relatorioId = Number(id);

    if (!Number.isInteger(relatorioId) || relatorioId <= 0) {
      throw new BadRequestException('ID do relatório inválido');
    }

    const relatorio = await this.prisma.relatorio.findUnique({
      where: { id: relatorioId },
    });

    if (!relatorio) {
      throw new NotFoundException('Relatório não encontrado');
    }

    if (!relatorio.urlDocumentoHash) {
      throw new NotFoundException('PDF do relatório não encontrado');
    }

    return {
      id: relatorio.id,
      url: relatorio.urlDocumentoHash,
    };
  }

  @Delete(':id')
  async excluirRelatorio(@Param('id') id: string) {
    const relatorioId = Number(id);

    if (!Number.isInteger(relatorioId) || relatorioId <= 0) {
      throw new BadRequestException('ID do relatório inválido');
    }

    const relatorio = await this.prisma.relatorio.findUnique({
      where: { id: relatorioId },
    });

    if (!relatorio) {
      throw new NotFoundException('Relatório não encontrado');
    }

    if (relatorio.urlDocumentoHash) {
      const url = new URL(relatorio.urlDocumentoHash);
      const partes = url.pathname.split('/').filter(Boolean);
      const uploadIndex = partes.indexOf('upload');

      if (uploadIndex !== -1) {
        const publicId = partes
          .slice(uploadIndex + 1)
          .filter((parte) => !/^v\d+$/.test(parte))
          .join('/')
          .replace(/\.pdf$/, '');

        await this.cloudinaryService.deletePdf(publicId);
      }
    }

    await this.prisma.relatorio.delete({
      where: { id: relatorioId },
    });

    return {
      mensagem: 'Relatório excluído com sucesso',
      id: relatorioId,
    };
  }
}