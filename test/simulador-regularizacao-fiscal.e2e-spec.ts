import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { Report } from '../src/models/report.model.js';
import { CloudinaryService } from '../src/cloudinary/cloudinary.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { PdfGeneratorService } from '../src/modules/relatorios/pdf-generator.service.js';
import { RelatoriosController } from '../src/modules/relatorios/relatorios.controller.js';
import { RelatoriosProducer } from '../src/modules/relatorios/relatorios.producer.js';
import { RelatoriosService } from '../src/modules/relatorios/relatorios.service.js';

describe('POST /relatorios/simulador-regularizacao-fiscal (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [RelatoriosController],
      providers: [
        RelatoriosService,
        {
          provide: getModelToken(Report),
          useValue: {},
        },
        {
          provide: RelatoriosProducer,
          useValue: {},
        },
        {
          provide: PrismaService,
          useValue: {},
        },
        {
          provide: CloudinaryService,
          useValue: {},
        },
        {
          provide: PdfGeneratorService,
          useValue: {},
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('retorna 200 com a resposta completa para uma requisição válida', async () => {
    const resposta = await request(app.getHttpServer())
      .post('/relatorios/simulador-regularizacao-fiscal')
      .send({
        impostos: 1000,
        multas: 200,
        honorarios: 300,
        quantidadeParcelas: 3,
      })
      .expect(200);

    expect(resposta.body).toEqual({
      impostos: 1000,
      multas: 200,
      honorarios: 300,
      totalRegularizacao: 1500,
      quantidadeParcelas: 3,
      valorParcela: 500,
    });
    expect(Object.keys(resposta.body)).toEqual([
      'impostos',
      'multas',
      'honorarios',
      'totalRegularizacao',
      'quantidadeParcelas',
      'valorParcela',
    ]);
  });

  it('aceita parcelas omitidas e usa uma parcela', async () => {
    const resposta = await request(app.getHttpServer())
      .post('/relatorios/simulador-regularizacao-fiscal')
      .send({ impostos: 100, multas: 50, honorarios: 25 })
      .expect(200);

    expect(resposta.body).toMatchObject({
      totalRegularizacao: 175,
      quantidadeParcelas: 1,
      valorParcela: 175,
    });
  });

  it.each([
    {},
    { impostos: 100, multas: 50 },
    { impostos: null, multas: 50, honorarios: 25 },
    { impostos: 'valor', multas: 50, honorarios: 25 },
  ])(
    'retorna 400 para campos obrigatórios ausentes ou tipos incorretos: %j',
    async (entrada) => {
      const resposta = await request(app.getHttpServer())
        .post('/relatorios/simulador-regularizacao-fiscal')
        .send(entrada)
        .expect(400);

      expect(resposta.body).toMatchObject({
        statusCode: 400,
        error: 'Bad Request',
      });
      expect(resposta.body.message).toEqual(expect.any(Array));
      expect(resposta.body.message.length).toBeGreaterThan(0);
    },
  );

  it.each([
    { impostos: -1, multas: 50, honorarios: 25 },
    { impostos: 100, multas: -1, honorarios: 25 },
    { impostos: 100, multas: 50, honorarios: -1 },
    { impostos: 100, multas: 50, honorarios: 25, quantidadeParcelas: 0 },
    { impostos: 100, multas: 50, honorarios: 25, quantidadeParcelas: -1 },
    { impostos: 100, multas: 50, honorarios: 25, quantidadeParcelas: 1.5 },
    {
      impostos: 100,
      multas: 50,
      honorarios: 25,
      quantidadeParcelas: 'muitas',
    },
  ])('retorna 400 para entrada inválida: %j', async (entrada) => {
    const resposta = await request(app.getHttpServer())
      .post('/relatorios/simulador-regularizacao-fiscal')
      .send(entrada)
      .expect(400);

    expect(resposta.body.statusCode).toBe(400);
    expect(resposta.body.error).toBe('Bad Request');
    expect(resposta.body.message).toEqual(expect.any(Array));
  });

  it('retorna 400 para combinação inconsistente de valores', async () => {
    const resposta = await request(app.getHttpServer())
      .post('/relatorios/simulador-regularizacao-fiscal')
      .send({
        impostos: -100,
        multas: 50,
        honorarios: 25,
        quantidadeParcelas: 0,
      })
      .expect(400);

    expect(resposta.body).toMatchObject({
      statusCode: 400,
      error: 'Bad Request',
    });
    expect(resposta.body.message).toEqual(
      expect.arrayContaining([
        'impostos must not be less than 0',
        'quantidadeParcelas must not be less than 1',
      ]),
    );
  });
});
