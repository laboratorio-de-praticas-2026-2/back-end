import { Injectable } from '@nestjs/common';
import { CreateContatoDto } from './dto/create-contato.dto.js';
import { UpdateContatoDto } from './dto/update-contato.dto.js';

@Injectable()
export class ContatoService {

  //constructor(private readonly prisma: PrismaService) {}
  private infoContact = {
    whatsapp: '00 00000-0000',
    telefone: '11 1111-1111',
    email: 'portalcontabil@gmail.com.br',
    endereco: 'R. Tamekishi Takano, 713 - Centro, Registro - SP, 11900-000',
    horarioAtendimento: 'Segunda a Sexta, das 08:00 ás 11:30, 13:00 ás 18:00',
  };

 getContact() {
  return this.infoContact;
}

  async putContact(updateContatoDto: UpdateContatoDto) {

    // const existingContact = await this.prisma.contato.findFirst();

    // if (existingContact) {
    //    return this.prisma.contato.update({
    //      where: { id: existingContact.id },
    //      data: updateContatoDto,
    //    });
    // }

    // return this.prisma.contato.create({
    //   data: {
    //     whatsapp: updateContatoDto.whatsapp ?? '',
    //     telefone: updateContatoDto.telefone ?? '',
    //     email: updateContatoDto.email ?? '',
    //     endereco: updateContatoDto.endereco ?? '',
    //     horarioAtendimento: updateContatoDto.horarioAtendimento ?? '',
    //   },
    // });

    this.infoContact = {
      ...this.infoContact,
      ...updateContatoDto
    }

    return this.infoContact;
  }

}
