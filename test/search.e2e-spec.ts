import { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import type { App } from 'supertest/types';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { Usuario } from '../src/models/usuario.model.js';

function adminToken(): string {
  return jwt.sign({ id: 1, nivel: 'administrador' }, process.env.JWT_SECRET || 'secret');
}

describe('Search (e2e)', () => {
  let app: INestApplication<App>;
  let usuarioModel: typeof Usuario;
  let usuarioId: number;
  const email = `cliente-e2e-${Date.now()}@example.com`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    usuarioModel = app.get(getModelToken(Usuario));

    const usuario = await usuarioModel.create({
      nome: 'Cliente Teste E2E',
      email,
      senha: 'hash-fake',
      cpfCnpj: '52998224725',
      celular: '11999998888',
    });
    usuarioId = usuario.id;
  });

  afterAll(async () => {
    await usuarioModel.destroy({ where: { id: usuarioId } });
    await app.close();
  });

  it('GET /search/document sem token retorna 403', async () => {
    await request(app.getHttpServer())
      .get('/search/document')
      .query({ doc: '529.982.247-25' })
      .expect(403);
  });

  it('GET /search/document com token de administrador e CPF válido e encontrado retorna dados completos', async () => {
    const response = await request(app.getHttpServer())
      .get('/search/document')
      .query({ doc: '529.982.247-25' })
      .set('Authorization', `Bearer ${adminToken()}`)
      .expect(200);

    expect(response.body.found).toBe(true);
    expect(response.body.data.cpfCnpj).toBe('52998224725');
    expect(response.body.data.email).toBe(email);
  });

  it('GET /search/document com token de administrador e CPF válido e não encontrado retorna found:false', async () => {
    const response = await request(app.getHttpServer())
      .get('/search/document')
      .query({ doc: '111.444.777-35' })
      .set('Authorization', `Bearer ${adminToken()}`)
      .expect(200);

    expect(response.body).toEqual({
      found: false,
      message: 'Nenhum resultado encontrado para o documento informado.',
    });
  });

  it('GET /search/document com documento inválido retorna 400', async () => {
    await request(app.getHttpServer())
      .get('/search/document')
      .query({ doc: '123' })
      .set('Authorization', `Bearer ${adminToken()}`)
      .expect(400);
  });

  it('GET /search/advanced sem token retorna 403', async () => {
    await request(app.getHttpServer()).get('/search/advanced').expect(403);
  });

  it('GET /search/advanced com token de administrador e sem filtros que casem retorna lista vazia', async () => {
    const response = await request(app.getHttpServer())
      .get('/search/advanced')
      .query({ nome: 'Nome Que Nao Existe No Banco De Teste' })
      .set('Authorization', `Bearer ${adminToken()}`)
      .expect(200);

    expect(response.body).toEqual({ total: 0, page: 1, pageSize: 20, results: [] });
  });

  it('GET /search/advanced com token de administrador encontra o usuário criado pelo nome', async () => {
    const response = await request(app.getHttpServer())
      .get('/search/advanced')
      .query({ nome: 'Cliente Teste E2E' })
      .set('Authorization', `Bearer ${adminToken()}`)
      .expect(200);

    expect(response.body.total).toBe(1);
    expect(response.body.results[0].nome).toBe('Cliente Teste E2E');
  });
});
