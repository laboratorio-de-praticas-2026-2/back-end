import { Body, Controller, Get, HttpCode, HttpStatus, Post, Put } from '@nestjs/common';
import { ContatoService } from './contato.service.js';
import { UpdateContatoDto } from './dto/update-contato.dto.js';
import { AuthService } from '../../commons/auth.service.js';
import { CadastroPjDto } from './dto/cadastro-pj.dto.js';

@Controller('contato')
export class ContatoController {
  constructor(
    private readonly contatoService: ContatoService,
    private readonly authService: AuthService,
  ) {}

  @Put()
  putContact(@Body() updateContatoDto: UpdateContatoDto) {
    return this.contatoService.putContact(updateContatoDto);
  }

  @Get()
  getContact() {
    return this.contatoService.getContact();
  }

  @Post('cadastro-pj')
  @HttpCode(HttpStatus.CREATED)
  async cadastrarPj(@Body() dto: CadastroPjDto) {
    return await this.contatoService.cadastrarPj(dto); 
  }
}