import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SimulacaoDto } from './simulacao.dto.js';

const build = (payload: Record<string, unknown>) =>
  plainToInstance(SimulacaoDto, payload);

describe('SimulacaoDto', () => {
  const base = { impostos: 1000, multas: 200, honorarios: 300 };

  it('aceita payload mínimo e completo', async () => {
    expect(await validate(build(base))).toHaveLength(0);
    expect(
      await validate(build({ ...base, parcelas: 360, taxaJurosMensal: 100 })),
    ).toHaveLength(0);
  });

  it.each(['impostos', 'multas', 'honorarios'])(
    'rejeita %s ausente ou negativo',
    async (campo) => {
      const { [campo]: _omit, ...semCampo } = base as Record<string, number>;
      expect((await validate(build(semCampo))).length).toBeGreaterThan(0);
      expect(
        (await validate(build({ ...base, [campo]: -1 }))).length,
      ).toBeGreaterThan(0);
    },
  );

  it('rejeita mais de 2 casas decimais', async () => {
    expect(
      (await validate(build({ ...base, impostos: 10.123 }))).length,
    ).toBeGreaterThan(0);
  });

  it('rejeita parcelas fora de 1..360 ou não inteiras', async () => {
    for (const parcelas of [0, 361, 2.5]) {
      expect(
        (await validate(build({ ...base, parcelas }))).length,
      ).toBeGreaterThan(0);
    }
  });

  it('rejeita taxa de juros fora de 0..100', async () => {
    for (const taxaJurosMensal of [-1, 100.01]) {
      expect(
        (await validate(build({ ...base, taxaJurosMensal }))).length,
      ).toBeGreaterThan(0);
    }
  });
});
