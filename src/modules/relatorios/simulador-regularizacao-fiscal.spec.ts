import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { SimuladorRegularizacaoFiscalDto } from './dto/simulador-regularizacao-fiscal.dto.js';
import { RelatoriosService } from './relatorios.service.js';

describe('Simulador de regularização fiscal', () => {
  const service = new RelatoriosService({} as any);

  describe('valores e cálculo', () => {
    it.each([
      {
        nome: 'valores baixos',
        entrada: { impostos: 1, multas: 2, honorarios: 3 },
        total: 6,
      },
      {
        nome: 'valores intermediários',
        entrada: { impostos: 1000.5, multas: 200.25, honorarios: 300.75 },
        total: 1501.5,
      },
      {
        nome: 'valores altos',
        entrada: { impostos: 999999999.99, multas: 1, honorarios: 0.01 },
        total: 1000000001,
      },
      {
        nome: 'valores zero',
        entrada: { impostos: 0, multas: 0, honorarios: 0 },
        total: 0,
      },
    ])('$nome', ({ entrada, total }) => {
      const resultado = service.simularRegularizacaoFiscal(entrada);

      expect(resultado).toEqual({
        ...entrada,
        totalRegularizacao: total,
        quantidadeParcelas: 1,
        valorParcela: total,
      });
    });

    it('calcula impostos, multas, honorários, total e valor da parcela', () => {
      const resultado = service.simularRegularizacaoFiscal({
        impostos: 1000,
        multas: 200,
        honorarios: 300,
        quantidadeParcelas: 3,
      });

      expect(resultado).toEqual({
        impostos: 1000,
        multas: 200,
        honorarios: 300,
        totalRegularizacao: 1500,
        quantidadeParcelas: 3,
        valorParcela: 500,
      });

      expect(resultado.totalRegularizacao).toBe(
        resultado.impostos + resultado.multas + resultado.honorarios,
      );

      expect(resultado.valorParcela).toBe(
        resultado.totalRegularizacao / resultado.quantidadeParcelas,
      );
    });
  });

  describe('parcelamento', () => {
    it.each([1, 2, 3, 12, Number.MAX_SAFE_INTEGER])(
      'aceita %s parcela(s)',
      (quantidadeParcelas) => {
        const resultado = service.simularRegularizacaoFiscal({
          impostos: 100,
          multas: 50,
          honorarios: 25,
          quantidadeParcelas,
        });

        expect(resultado.quantidadeParcelas).toBe(quantidadeParcelas);
        expect(resultado.valorParcela).toBe(175 / quantidadeParcelas);
      },
    );

    it('usa uma parcela quando a quantidade não é informada', () => {
      expect(
        service.simularRegularizacaoFiscal({
          impostos: 100,
          multas: 50,
          honorarios: 25,
        }).quantidadeParcelas,
      ).toBe(1);
    });

    it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
      'rejeita quantidade inválida: %s',
      (quantidadeParcelas) => {
        expect(() =>
          service.simularRegularizacaoFiscal({
            impostos: 100,
            multas: 50,
            honorarios: 25,
            quantidadeParcelas,
          }),
        ).toThrow(BadRequestException);
      },
    );
  });

  describe('entrada e segurança do resultado', () => {
    it('rejeita dados ausentes', () => {
      try {
        service.simularRegularizacaoFiscal(undefined as any);
        expect.fail('A simulação deveria rejeitar dados ausentes.');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).getStatus()).toBe(400);
        expect((error as BadRequestException).getResponse()).toMatchObject({
          statusCode: 400,
          message: 'Dados da simulação são obrigatórios.',
        });
      }
    });

    it.each(['impostos', 'multas', 'honorarios'] as const)(
      'rejeita %s ausente',
      (campo) => {
        const entrada: Record<string, number> = {
          impostos: 100,
          multas: 50,
          honorarios: 25,
        };

        delete entrada[campo];

        expect(() =>
          service.simularRegularizacaoFiscal(entrada as any),
        ).toThrow(BadRequestException);
      },
    );

    it.each(['impostos', 'multas', 'honorarios'] as const)(
      'rejeita %s negativo, NaN ou infinito',
      (campo) => {
        for (const valor of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
          expect(() =>
            service.simularRegularizacaoFiscal({
              impostos: 100,
              multas: 50,
              honorarios: 25,
              [campo]: valor,
            }),
          ).toThrow(BadRequestException);
        }
      },
    );

    it('produz resposta completa, finita e consistente', () => {
      const resultado = service.simularRegularizacaoFiscal({
        impostos: 0.01,
        multas: 0.02,
        honorarios: 0.03,
        quantidadeParcelas: 2,
      });

      expect(Object.keys(resultado)).toEqual([
        'impostos',
        'multas',
        'honorarios',
        'totalRegularizacao',
        'quantidadeParcelas',
        'valorParcela',
      ]);

      expect(
        Object.values(resultado).every((valor) => Number.isFinite(valor)),
      ).toBe(true);

      expect(
        Object.values(resultado).every((valor) => valor !== undefined),
      ).toBe(true);

      expect(resultado.totalRegularizacao).toBe(0.06);
      expect(resultado.valorParcela).toBe(0.03);
    });

    it('converte falha inesperada durante o cálculo em erro interno', () => {
      const serviceComFalha = new RelatoriosService({} as any);

      Object.defineProperty(serviceComFalha, 'validarResultado', {
        value: () => {
          throw new Error('falha inesperada');
        },
      });

      try {
        serviceComFalha.simularRegularizacaoFiscal({
          impostos: 100,
          multas: 50,
          honorarios: 25,
        });

        expect.fail('A simulação deveria lançar um erro interno.');
      } catch (error) {
        expect(error).toBeInstanceOf(InternalServerErrorException);
        expect((error as InternalServerErrorException).getStatus()).toBe(500);
        expect(
          (error as InternalServerErrorException).getResponse(),
        ).toMatchObject({
          statusCode: 500,
          message:
            'Não foi possível processar a simulação de regularização fiscal.',
        });
      }
    });
  });

  describe('validação do DTO', () => {
    it.each([
      {},
      { impostos: 100, multas: 50 },
      { impostos: 'cem', multas: 50, honorarios: 25 },
      { impostos: 100.123, multas: 50, honorarios: 25 },
      { impostos: -1, multas: 50, honorarios: 25 },
      { impostos: 100, multas: 50, honorarios: 25, quantidadeParcelas: 0 },
      { impostos: 100, multas: 50, honorarios: 25, quantidadeParcelas: -1 },
      { impostos: 100, multas: 50, honorarios: 25, quantidadeParcelas: 1.5 },
      {
        impostos: 100,
        multas: 50,
        honorarios: 25,
        quantidadeParcelas: 'muitas',
      },
      {
        impostos: 100,
        multas: 50,
        honorarios: 25,
        quantidadeParcelas: null,
      },
      {
        impostos: 100,
        multas: 50,
        honorarios: 25,
        quantidadeParcelas: true,
      },
      {
        impostos: 100,
        multas: 50,
        honorarios: 25,
        quantidadeParcelas: false,
      },
    ])('rejeita entrada inválida: $input', async (input) => {
      const erros = await validate(
        plainToInstance(SimuladorRegularizacaoFiscalDto, input),
      );

      expect(erros.length).toBeGreaterThan(0);
    });

    it('aceita valores obrigatórios e parcelas opcional', async () => {
      const erros = await validate(
        plainToInstance(SimuladorRegularizacaoFiscalDto, {
          impostos: 100,
          multas: 50,
          honorarios: 25,
        }),
      );

      expect(erros).toHaveLength(0);
    });
  });
});