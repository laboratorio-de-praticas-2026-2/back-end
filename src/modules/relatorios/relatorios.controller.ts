import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';

import { CreateReportDto } from './dto/create-report.dto.js';
import { FindReportsDto } from './dto/find-reports.dto.js';
import { RelatorioPdfDto } from './dto/relatorio-pdf.dto.js';
import { SimulacaoDto } from './dto/simulacao.dto.js';
import { GenerateReportDto } from './dto/generate-report.dto.js';

import { RelatoriosService } from './relatorios.service.js';
import { RelatoriosProducer } from './relatorios.producer.js';
import { PdfGeneratorService } from './pdf-generator.service.js';
import { CloudinaryService } from '../../cloudinary/cloudinary.service.js';

@ApiTags('Relatórios')
@Controller('relatorios')
export class RelatoriosController {
  constructor(
    private readonly relatoriosService: RelatoriosService,
    private readonly relatoriosProducer: RelatoriosProducer,
    private readonly pdfGeneratorService: PdfGeneratorService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post('simulacao')
  @ApiOperation({
    summary: 'Simular valores de um relatório',
    description:
      'Calcula subtotal, juros, total e valor das parcelas com base nos valores informados.',
  })
  @ApiBody({ type: SimulacaoDto })
  @ApiCreatedResponse({
    description: 'Simulação realizada com sucesso.',
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos para a simulação.',
  })
  simular(@Body() dto: SimulacaoDto) {
    return this.relatoriosService.simular(dto);
  }

  @Post('preview')
  @ApiOperation({
    summary: 'Pré-visualizar relatório em PDF',
    description:
      'Gera o PDF do relatório em memória e retorna o arquivo diretamente na resposta, sem criar arquivo temporário.',
  })
  @ApiProduces('application/pdf')
  @ApiBody({
    type: RelatorioPdfDto,
    description: 'Dados utilizados para gerar a pré-visualização do relatório.',
  })
  @ApiOkResponse({
    description: 'PDF gerado com sucesso.',
    content: {
      'application/pdf': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos para geração do PDF.',
  })
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
  @ApiOperation({
    summary: 'Criar relatório',
    description:
      'Cria um novo relatório com status inicial PENDENTE.',
  })
  @ApiBody({ type: CreateReportDto })
  @ApiCreatedResponse({
    description: 'Relatório criado com sucesso.',
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos para criação do relatório.',
  })
  async create(@Body() data: CreateReportDto) {
    return this.relatoriosService.create(data);
  }

  @Get('categorias')
  @ApiOperation({
    summary: 'Listar categorias dos relatórios',
    description:
      'Retorna a lista de categorias cadastradas nos relatórios.',
  })
  @ApiOkResponse({
    description: 'Categorias retornadas com sucesso.',
    schema: {
      type: 'array',
      items: {
        type: 'string',
      },
      example: ['Financeiro', 'Jurídico', 'Administrativo'],
    },
  })
  async findCategories() {
    return this.relatoriosService.findCategories();
  }

  @Get()
  @ApiOperation({
    summary: 'Listar relatórios',
    description:
      'Lista relatórios com filtros por nome, categoria, status e período, além de paginação.',
  })
  @ApiOkResponse({
    description: 'Relatórios encontrados com sucesso.',
    schema: {
      example: {
        dados: [
          {
            id: 'fa1342e6-3c0d-4048-98ff-c5111e5b2647',
            nome: 'Relatório Financeiro Mensal',
            categoria: 'Financeiro',
            descricao:
              'Relatório financeiro referente ao mês de setembro.',
            dataInicio: '2026-09-01T00:00:00.000Z',
            dataTermino: '2026-09-30T00:00:00.000Z',
            status: 'GERADO',
            arquivoUrl:
              'https://res.cloudinary.com/exemplo/raw/upload/relatorio.pdf',
          },
        ],
        total: 1,
        pagina: 1,
        limite: 10,
        temProximaPagina: false,
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Filtros ou parâmetros de paginação inválidos.',
  })
  async findAll(@Query() filters: FindReportsDto) {
    return this.relatoriosService.findAll(filters);
  }

  @Post('generate')
  @ApiOperation({
    summary: 'Solicitar geração do PDF de um relatório',
    description:
      'Coloca o relatório na fila de geração. O processamento é assíncrono. O relatório permanece PENDENTE até a conclusão da geração.',
  })
  @ApiBody({ type: GenerateReportDto })
  @ApiCreatedResponse({
    description: 'Job de geração enviado para a fila.',
    schema: {
      example: {
        mensagem: 'Job de geração de relatório enviado para a fila',
        relatorioId: 'fa1342e6-3c0d-4048-98ff-c5111e5b2647',
        status: 'PENDENTE',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'ID do relatório inválido ou dados inválidos.',
  })
  @ApiNotFoundResponse({
    description: 'Relatório não encontrado.',
  })
  async gerarRelatorio(@Body() dto: GenerateReportDto) {
    const relatorio = await this.relatoriosService.findById(
      dto.relatorioId,
    );

    await this.relatoriosService.updateStatus(
      dto.relatorioId,
      'PENDENTE',
    );

    await this.relatoriosProducer.adicionarGeracao(dto.relatorioId);

    return {
      mensagem: 'Job de geração de relatório enviado para a fila',
      relatorioId: relatorio.id,
      status: 'PENDENTE',
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar relatório por ID',
    description:
      'Retorna os dados completos de um relatório, incluindo status e URL do PDF quando disponível.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID do relatório',
    example: 'fa1342e6-3c0d-4048-98ff-c5111e5b2647',
  })
  @ApiOkResponse({
    description: 'Relatório encontrado com sucesso.',
  })
  @ApiBadRequestResponse({
    description: 'ID informado não é um UUID válido.',
  })
  @ApiNotFoundResponse({
    description: 'Relatório não encontrado.',
  })
  async buscarRelatorio(
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.relatoriosService.findById(id);
  }

  @Get(':id/pdf')
  @ApiOperation({
    summary: 'Obter URL do PDF gerado',
    description:
      'Retorna a URL do PDF armazenado no Cloudinary. O relatório precisa estar com um PDF gerado.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID do relatório',
    example: 'fa1342e6-3c0d-4048-98ff-c5111e5b2647',
  })
  @ApiOkResponse({
    description: 'URL do PDF retornada com sucesso.',
    schema: {
      example: {
        id: 'fa1342e6-3c0d-4048-98ff-c5111e5b2647',
        url: 'https://res.cloudinary.com/exemplo/raw/upload/relatorio.pdf',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'ID inválido ou relatório ainda não possui PDF gerado.',
  })
  @ApiNotFoundResponse({
    description: 'Relatório não encontrado.',
  })
  async buscarPdf(
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const relatorio = await this.relatoriosService.findById(id);

    if (!relatorio.arquivoUrl) {
      throw new BadRequestException(
        'O relatório ainda não possui um PDF gerado',
      );
    }

    return {
      id: relatorio.id,
      url: relatorio.arquivoUrl,
    };
  }

  @Get(':id/preview')
  @ApiOperation({
    summary: 'Pré-visualizar o PDF de um relatório',
    description:
      'Retorna o PDF do relatório diretamente no navegador quando o status for GERADO. Para relatórios PENDENTE ou FALHA, informa a situação da geração.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID do relatório',
    example: 'fa1342e6-3c0d-4048-98ff-c5111e5b2647',
  })
  @ApiProduces('application/pdf')
  @ApiOkResponse({
    description: 'PDF retornado com sucesso.',
    content: {
      'application/pdf': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description:
      'Relatório ainda está pendente, falhou na geração ou não possui PDF disponível.',
  })
  @ApiNotFoundResponse({
    description: 'Relatório não encontrado.',
  })
  async previewRelatorio(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Res() response: Response,
  ): Promise<void> {
    const relatorio = await this.relatoriosService.findById(id);

    if (relatorio.status === 'PENDENTE') {
      throw new BadRequestException(
        'O PDF do relatório ainda está sendo gerado',
      );
    }

    if (relatorio.status === 'FALHA') {
      throw new BadRequestException(
        'A geração do PDF do relatório falhou',
      );
    }

    if (!relatorio.arquivoUrl) {
      throw new BadRequestException(
        'O relatório está marcado como GERADO, mas não possui um PDF disponível',
      );
    }

    const pdf = await this.cloudinaryService.downloadPdf(
      relatorio.arquivoUrl,
    );

    response
      .set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
        'Content-Length': String(pdf.length),
      })
      .send(pdf);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Excluir relatório',
    description:
      'Exclui o PDF armazenado no Cloudinary antes de remover o registro do banco de dados.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID do relatório',
    example: 'fa1342e6-3c0d-4048-98ff-c5111e5b2647',
  })
  @ApiOkResponse({
    description: 'Relatório excluído com sucesso.',
    schema: {
      example: {
        mensagem: 'Relatório excluído com sucesso',
        id: 'fa1342e6-3c0d-4048-98ff-c5111e5b2647',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'ID informado não é um UUID válido.',
  })
  @ApiNotFoundResponse({
    description: 'Relatório não encontrado.',
  })
  async excluirRelatorio(
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.relatoriosService.delete(id);
  }
}