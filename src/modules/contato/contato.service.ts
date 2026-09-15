import { Injectable } from '@nestjs/common';
import { UpdateContatoDto } from './dto/update-contato.dto.js';
//import { PrismaService } from '';

@Injectable()
export class ContatoService {

  //constructor(private readonly prisma: PrismaService) {}
  private infoContact = {
    whatsapp: '00 00000-1000',
    telefone: '11 1111-1111',
    email: 'portalcontabil@gmail.com.br',
    endereco: 'R. Tamekishi Takano, 713 - Centro, Registro - SP, 11900-000',
    horarioAtendimento: 'Segunda a Sexta, das 08:00 ás 11:30, 13:00 ás 18:00',
  };

  async getContact() {
    //return this.prisma.contato.findFirst();

    return this.infoContact;
  }

}
