import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';

import { MapaService } from './mapa.service.js';
import { CreateParceiroDto } from './dto/create-parceiro.dto.js';

@Controller('mapa')
export class MapaController {
  constructor(private readonly mapaService: MapaService) {}

  @Post('parceiros')
  @HttpCode(HttpStatus.CREATED)
  cadastrarParceiro(@Body() body: CreateParceiroDto) {
    return this.mapaService.cadastrar(body);
  }

  @Get('parceiros/:id')
  @HttpCode(HttpStatus.OK)
  findParceiroById(@Param('id', ParseIntPipe) id: number) {
    return this.mapaService.findParceiroById(id);
  }

  @Get()
  listarParceiros() {
    return this.mapaService.findAllParceiros();
  }

  @Get('tipo/:tipo')
  buscarPorTipo(@Param('tipo') tipo: string) {
    return this.mapaService.findByTipo(tipo);
  }

  @Get('cidade/:cidade')
  buscarPorCidade(@Param('cidade') cidade: string) {
    return this.mapaService.findByCidade(cidade);
  }

  @Get('filtro')
  filtrarParceiros(
    @Query('tipo') tipo?: string,
    @Query('cidade') cidade?: string,
  ) {
    return this.mapaService.findComFiltro(tipo, cidade);
  }
}
