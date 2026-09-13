import { Body, Controller, Get, Put} from '@nestjs/common';
import { ContatoService } from './contato.service.js';
import { UpdateContatoDto } from './dto/update-contato.dto.js';

@Controller('contato')
export class ContatoController {
  constructor(private readonly contatoService: ContatoService) {}

  @Put()
  putContact(@Body() updateContatoDto: UpdateContatoDto){
    return this.contatoService.putContact(updateContatoDto)
  }
}
