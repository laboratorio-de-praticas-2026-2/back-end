import { RelatoriosService } from './relatorios.service.js';

describe('RelatoriosService', () => {
  it('calcula o total e o valor das parcelas com juros', () => {
    const service = new RelatoriosService();

    expect(
      service.simular({
        impostos: 1000,
        multas: 200,
        honorarios: 300,
        parcelas: 3,
        taxaJurosMensal: 10,
      }),
    ).toEqual({
      impostos: 1000,
      multas: 200,
      honorarios: 300,
      subtotal: 1500,
      parcelas: 3,
      taxaJurosMensal: 10,
      total: 1815,
      valorParcela: 605,
    });
  });

  it('considera pagamento a vista quando parcelas não é informado', () => {
    const service = new RelatoriosService();

    expect(service.simular({ impostos: 100, multas: 50, honorarios: 25 })).toMatchObject({
      parcelas: 1,
      total: 175,
      valorParcela: 175,
    });
  });
});