import { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import type { App } from 'supertest/types';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { Empresa } from '../src/models/empresa.model.js';
import { Usuario } from '../src/models/usuario.model.js';

const TEST_JWT_SECRET = 'test-secret-e2e';

function adminToken(): string {
  return jwt.sign({ id: 1, nivel: 'administrador' }, TEST_JWT_SECRET);
}

function clienteToken(id: number): string {
  return jwt.sign({ id, nivel: 'cliente' }, TEST_JWT_SECRET);
}

describe('Search (e2e)', () => {
  let app: INestApplication<App>;
  let usuarioModel: typeof Usuario;
  let empresaModel: typeof Empresa;
  let usuarioId: number;
  let empresaId: number;
  let terceiroId: number;
  let terceiroEmpresaId: number;
  const email = `cliente-e2e-${Date.now()}@example.com`;
  const terceiroEmail = `terceiro-e2e-${Date.now()}@example.com`;
  const empresaCnpj = '11222333000181';
  const terceiroCpf = '11144477735';
  const terceiroCnpj = '11444777000161';

  beforeAll(async () => {
    process.env.JWT_SECRET = TEST_JWT_SECRET;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    usuarioModel = app.get(getModelToken(Usuario));
    empresaModel = app.get(getModelToken(Empresa));

    await usuarioModel.destroy({ where: { email } });
    await usuarioModel.destroy({ where: { email: terceiroEmail } });

    const usuario = await usuarioModel.create({
      nome: 'Cliente Teste E2E',
      email,
      senha: 'hash-fake',
      cpfCnpj: '52998224725',
      celular: '11999998888',
    });
    usuarioId = usuario.id;

    const empresa = await empresaModel.create({
      usuarioId: usuario.id,
      razaoSocial: 'Empresa Teste E2E Ltda',
      nomeFantasia: 'Empresa Teste',
      cnpj: empresaCnpj,
      regimeTributario: 'simples_nacional',
      inscricaoEstadual: '123456789',
      inscricaoMunicipal: '987654321',
      dataAbertura: new Date('2020-01-01'),
    });
    empresaId = empresa.id;

    const terceiro = await usuarioModel.create({
      nome: 'Terceiro Teste E2E',
      email: terceiroEmail,
      senha: 'hash-fake',
      cpfCnpj: terceiroCpf,
    });
    terceiroId = terceiro.id;

    const terceiroEmpresa = await empresaModel.create({
      usuarioId: terceiro.id,
      razaoSocial: 'Empresa Terceiro E2E Ltda',
      cnpj: terceiroCnpj,
      regimeTributario: 'mei',
    });
    terceiroEmpresaId = terceiroEmpresa.id;
  });

  afterAll(async () => {
    await empresaModel.destroy({ where: { id: [empresaId, terceiroEmpresaId] } });
    await usuarioModel.destroy({ where: { id: [usuarioId, terceiroId] } });
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
    expect(response.body.data.senha).toBeUndefined();
    expect(response.body.data.empresas).toBeInstanceOf(Array);
    expect(response.body.data.empresas.length).toBeGreaterThan(0);
    expect(response.body.data.empresas[0].razaoSocial).toBe('Empresa Teste E2E Ltda');
  });

  it('GET /search/document com token de administrador e CNPJ válido e encontrado retorna dados da empresa', async () => {
    const response = await request(app.getHttpServer())
      .get('/search/document')
      .query({ doc: empresaCnpj })
      .set('Authorization', `Bearer ${adminToken()}`)
      .expect(200);

    expect(response.body.found).toBe(true);
    expect(response.body.tipo).toBe('pessoa_juridica');
    expect(response.body.data.razaoSocial).toBe('Empresa Teste E2E Ltda');
    expect(response.body.data.cnpj).toBe(empresaCnpj);
    expect(response.body.data.regimeTributario).toBe('simples_nacional');
    expect(response.body.data.titular.email).toBe(email);
  });

  it('cliente busca o próprio CPF e recebe os próprios dados completos', async () => {
    const response = await request(app.getHttpServer())
      .get('/search/document')
      .query({ doc: '529.982.247-25' })
      .set('Authorization', `Bearer ${clienteToken(usuarioId)}`)
      .expect(200);

    expect(response.body.found).toBe(true);
    expect(response.body.data.email).toBe(email);
    expect(response.body.data.senha).toBeUndefined();
    expect(response.body.data.empresas[0].razaoSocial).toBe('Empresa Teste E2E Ltda');
  });

  it('cliente busca o CNPJ de empresa vinculada à própria conta', async () => {
    const response = await request(app.getHttpServer())
      .get('/search/document')
      .query({ doc: empresaCnpj })
      .set('Authorization', `Bearer ${clienteToken(usuarioId)}`)
      .expect(200);

    expect(response.body.tipo).toBe('pessoa_juridica');
    expect(response.body.data.titular.email).toBe(email);
  });

  it('cliente busca CPF de terceiro e recebe 403 sem dados', async () => {
    const response = await request(app.getHttpServer())
      .get('/search/document')
      .query({ doc: terceiroCpf })
      .set('Authorization', `Bearer ${clienteToken(usuarioId)}`)
      .expect(403);

    expect(JSON.stringify(response.body)).not.toContain(terceiroEmail);
  });

  it('cliente busca CNPJ de empresa não vinculada e recebe 403 sem dados', async () => {
    const response = await request(app.getHttpServer())
      .get('/search/document')
      .query({ doc: terceiroCnpj })
      .set('Authorization', `Bearer ${clienteToken(usuarioId)}`)
      .expect(403);

    expect(JSON.stringify(response.body)).not.toContain('Terceiro');
  });

  it('cliente busca documento inexistente e recebe o mesmo 403 de um terceiro', async () => {
    await request(app.getHttpServer())
      .get('/search/document')
      .query({ doc: '390.533.447-05' })
      .set('Authorization', `Bearer ${clienteToken(usuarioId)}`)
      .expect(403);
  });

  it('GET /search/document com token de administrador e CPF de terceiro retorna os dados completos', async () => {
    const response = await request(app.getHttpServer())
      .get('/search/document')
      .query({ doc: terceiroCpf })
      .set('Authorization', `Bearer ${adminToken()}`)
      .expect(200);

    expect(response.body.data.email).toBe(terceiroEmail);
  });

  it('GET /search/document com token de administrador e CPF válido e não encontrado retorna found:false', async () => {
    const response = await request(app.getHttpServer())
      .get('/search/document')
      .query({ doc: '390.533.447-05' })
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

  it('cliente na busca avançada enxerga apenas a própria conta, mesmo sem filtros', async () => {
    const response = await request(app.getHttpServer())
      .get('/search/advanced')
      .set('Authorization', `Bearer ${clienteToken(usuarioId)}`)
      .expect(200);

    expect(response.body.total).toBe(1);
    expect(response.body.results[0].id).toBe(usuarioId);
    expect(JSON.stringify(response.body)).not.toContain(terceiroEmail);
  });

  it('cliente na busca avançada filtrando por nome de terceiro não encontra nada', async () => {
    const response = await request(app.getHttpServer())
      .get('/search/advanced')
      .query({ nome: 'Terceiro Teste E2E' })
      .set('Authorization', `Bearer ${clienteToken(usuarioId)}`)
      .expect(200);

    expect(response.body).toEqual({ total: 0, page: 1, pageSize: 20, results: [] });
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
