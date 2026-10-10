import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
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
}
