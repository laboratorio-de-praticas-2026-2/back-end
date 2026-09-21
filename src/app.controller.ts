import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';
import { RelatoriosProducer } from './relatorios/relatorios.producer.js';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly relatoriosProducer: RelatoriosProducer,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('teste-pdf')
  async testePdf() {
    await this.relatoriosProducer.adicionarGeracao(1);

    return {
      mensagem: 'Job de geração de PDF enviado para a fila',
    };
  }
}