import { Injectable } from '@nestjs/common';
import { SimulacaoDto } from './dto/simulacao.dto.js';

@Injectable()
export class RelatoriosService {
  simular(dto: SimulacaoDto) {
    const subtotal = dto.impostos + dto.multas + dto.honorarios;
    const parcelas = dto.parcelas ?? 1;
    const taxa = dto.taxaJurosMensal ?? 0;
    const total = subtotal * Math.pow(1 + taxa / 100, parcelas - 1);

    return {
      impostos: dto.impostos,
      multas: dto.multas,
      honorarios: dto.honorarios,
      subtotal,
      parcelas,
      taxaJurosMensal: taxa,
      total: Number(total.toFixed(2)),
      valorParcela: Number((total / parcelas).toFixed(2)),
    };
  }

}