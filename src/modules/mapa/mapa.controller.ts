import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post } from '@nestjs/common';
import { MapaService } from './mapa.service.js';
import { CreateParceiroDto } from './dto/create-parceiro.dto.js';

@Controller()
export class MapaController {
  constructor(private readonly mapaService: MapaService) {}

  @Post('mapa/parceiros')
  @HttpCode(HttpStatus.CREATED)
  cadastrarParceiro(@Body() body: CreateParceiroDto) {
    return this.mapaService.cadastrar(body);
  }

  @Get('mapa/parceiros/:id')
  @HttpCode(HttpStatus.OK)
  findParceiroById(@Param('id', ParseIntPipe) id: number) {
    return this.mapaService.findParceiroById(id);
  }
}
