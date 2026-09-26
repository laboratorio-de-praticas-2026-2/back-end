import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ServicoService } from './servico.service.js';
import { CreateServicoDto } from './dto/criar-servico.dto.js';
import { UpdateServicoDto } from './dto/atualizar-servico.dto.js';

@Controller('servicos')
export class ServicoController {
  constructor(private readonly servicoService: ServicoService) {}

  @Post()
  create(@Body() createServicoDto: CreateServicoDto) {
    return this.servicoService.create(createServicoDto);
  }

  @Get()
  findAll(@Query('incluirInativos') incluirInativos?: string) {
    // Se passar ?incluirInativos=true, mostrarTodos fica true. 
    // Se não passar nada, mostrarTodos fica false (comportamento padrão = só ativos).
    const mostrarTodos = incluirInativos === 'true';
    return this.servicoService.findAll(mostrarTodos);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.servicoService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateServicoDto: UpdateServicoDto,
  ) {
    return this.servicoService.update(id, updateServicoDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.servicoService.remove(id);
  }
}