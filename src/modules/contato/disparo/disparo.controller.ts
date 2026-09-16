import { Controller, Post } from '@nestjs/common';
import { DisparoService } from './disparo.service.js';

@Controller('disparo')
export class DisparoController {
  constructor(private readonly disparoService: DisparoService) {}

  @Post()
  dispararEmail() {
    return this.disparoService.dispararEmail();
  }
}