import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  NotFoundException,
  Query,
  Res,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';

import { CreateReportDto } from './dto/create-report.dto.js';
import { FindReportsDto } from './dto/find-reports.dto.js';
import { RelatorioPdfDto } from './dto/relatorio-pdf.dto.js';
import { SimulacaoDto } from './dto/simulacao.dto.js';
import { SimuladorRegularizacaoFiscalDto } from './dto/simulador-regularizacao-fiscal.dto.js';
import { SimuladorRegularizacaoFiscalResponseDto } from './dto/simulador-regularizacao-fiscal-response.dto.js';

import { RelatoriosService } from './relatorios.service.js';
import { RelatoriosProducer } from './relatorios.producer.js';
import { PdfGeneratorService } from './pdf-generator.service.js';

import { PrismaService } from '../../prisma/prisma.service.js';
import { CloudinaryService } from '../../cloudinary/cloudinary.service.js';

@Controller('relatorios')
@ApiTags('Relatórios')
export class RelatoriosController {
  constructor(
    private readonly relatoriosService: RelatoriosService,
    private readonly relatoriosProducer: RelatoriosProducer,
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly pdfGeneratorService: PdfGeneratorService,
  ) {}

  @Post('simulacao')
  simular(@Body() dto: SimulacaoDto) {
    return this.relatoriosService.simular(dto);
  }

  @Post('simulador-regularizacao-fiscal')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Simular regularização fiscal',
    description:
      'Soma os valores de impostos, multas e honorários informados e divide o total pela quantidade de parcelas. Não aplica juros, descontos, correção monetária ou taxas adicionais.',
  })
  @ApiBody({
    type: SimuladorRegularizacaoFiscalDto,
    examples: {
      valido: {
        summary: 'Request válido',
        value: {
          impostos: 1000,
          multas: 200,
          honorarios: 300,
          quantidadeParcelas: 3,
        },
      },
      invalido: {
        summary: 'Request inválido',
        value: {
          impostos: -100,
          multas: 200,
          honorarios: 300,
          quantidadeParcelas: 0,
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Simulação realizada com sucesso.',
    type: SimuladorRegularizacaoFiscalResponseDto,
    example: {
      impostos: 1000,
      multas: 200,
      honorarios: 300,
      totalRegularizacao: 1500,
      quantidadeParcelas: 3,
      valorParcela: 500,
    },
  })
  @ApiBadRequestResponse({
    description: 'Dados de entrada ausentes, inválidos ou inconsistentes.',
    examples: {
      campoObrigatorio: {
        summary: 'Campo obrigatório ausente',
        value: {
          statusCode: 400,
          message: ['impostos should not be null or undefined'],
          error: 'Bad Request',
        },
      },
      parcelasInvalidas: {
        summary: 'Quantidade de parcelas inválida',
        value: {
          statusCode: 400,
          message: ['quantidadeParcelas must not be less than 1'],
          error: 'Bad Request',
        },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno inesperado durante a simulação.',
    example: {
      statusCode: 500,
      message: 'Não foi possível processar a simulação de regularização fiscal.',
      error: 'Internal Server Error',
    },
  })
  simularRegularizacaoFiscal(
    @Body() dto: SimuladorRegularizacaoFiscalDto,
  ): SimuladorRegularizacaoFiscalResponseDto {
    return this.relatoriosService.simularRegularizacaoFiscal(dto);
  }

  @Post('preview')
  async preview(
    @Body() dto: RelatorioPdfDto,
    @Res() response: Response,
  ): Promise<void> {
    const pdf = await this.pdfGeneratorService.gerar(dto);

    response
      .set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
        'Content-Length': String(pdf.length),
      })
      .send(pdf);
  }

  @Post()
  async create(@Body() data: CreateReportDto) {
    return this.relatoriosService.create(data);
  }

  @Get('categorias')
  async findCategories() {
    return this.relatoriosService.findCategories();
  }

  @Get()
  async findAll(@Query() filters: FindReportsDto) {
    return this.relatoriosService.findAll(filters);
  }

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
      data: { status: 'pendente' },
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
          .join('/');

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