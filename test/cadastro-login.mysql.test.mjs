import { Empresa } from '../dist/models/empresa.model.js';
import 'reflect-metadata';
import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomInt, randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { Test } from '@nestjs/testing';
import { SequelizeModule } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { ClienteModule } from '../dist/modules/cliente/cliente.module.js';
import { AuthModule } from '../dist/modules/auth/auth.module.js';
import { Usuario } from '../dist/models/usuario.model.js';
import { validationPipe } from '../dist/commons/pipes/validation.pipe.js';

function gerarCpf() {
  const digitos = Array.from({ length: 9 }, () => randomInt(10));
  for (let tamanho = 9; tamanho <= 10; tamanho++) {
    const soma = digitos.reduce(
      (total, digito, i) => total + digito * (tamanho + 1 - i),
      0,
    );
    const resto = (soma * 10) % 11;
    digitos.push(resto === 10 ? 0 : resto);
  }
  return digitos
    .join('')
    .replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
}

test(
  'cadastro PF -> login -> perfil no MySQL real',
  { timeout: 60000 },
  async () => {
    const host = process.env.DB_HOST;
    assert.ok(
      ['localhost', '127.0.0.1', '::1'].includes(host),
      'Use um MySQL LOCAL com as migrations oficiais aplicadas.',
    );
    const segredoAnterior = process.env.JWT_SECRET;
    process.env.JWT_SECRET = randomUUID();
    const email = `issue50-${randomUUID()}@example.test`;
    const senha = 'Teste-PF-50!2026';
    let app;
    let modulo;
    let sequelize;
    let bancoConectado = false;
    try {
      modulo = await Test.createTestingModule({
        imports: [
          SequelizeModule.forRoot({
            dialect: 'mysql',
            host,
            port: Number(process.env.DB_PORT || 3306),
            username: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            models: [Usuario, Empresa],
            synchronize: false,
            logging: false,
            retryAttempts: 0,
          }),
          ClienteModule,
          AuthModule,
        ],
      }).compile();
      sequelize = modulo.get(Sequelize);
      await sequelize.authenticate();
      bancoConectado = true;
      app = modulo.createNestApplication({ logger: false });
      app.useGlobalPipes(validationPipe);
      await app.init();
      const http = request(app.getHttpServer());
      const cadastro = {
        nome: 'Teste integração PF',
        email,
        senha,
        cpfCnpj: gerarCpf(),
      };
      const criado = await http.post('/clientes').send(cadastro);
      assert.equal(criado.status, 201, JSON.stringify(criado.body));
      assert.equal(criado.body.email, email);
      assert.equal(criado.body.nivel, 'cliente');
      assert.equal('senha' in criado.body, false);

      // Consulta direta comprova a persistência na tabela oficial, sem sync ou mocks.
      const [linhas] = await sequelize.query(
        'SELECT id, senha FROM usuario WHERE email = :email',
        { replacements: { email } },
      );
      assert.equal(linhas.length, 1);
      assert.equal(linhas[0].id, criado.body.id);
      assert.notEqual(linhas[0].senha, senha);
      assert.ok(await bcrypt.compare(senha, linhas[0].senha));

      const login = await http
        .post('/auth/login')
        .send({ email: ` ${email.toUpperCase()} `, senha })
        .expect(200);
      assert.equal(login.body.usuario.id, criado.body.id);
      assert.equal(login.body.tokenType, 'Bearer');
      assert.equal('senha' in login.body.usuario, false);
      assert.equal('senhaHash' in login.body.usuario, false);
      assert.ok(login.body.accessToken);
      const perfil = await http
        .get('/auth/me')
        .auth(login.body.accessToken, { type: 'bearer' })
        .expect(200);
      assert.equal(perfil.body.id, criado.body.id);
      assert.equal(perfil.body.email, email);
      await http
        .post('/auth/login')
        .send({ email, senha: 'Senha-incorreta' })
        .expect(401);
      await http.post('/clientes').send(cadastro).expect(409);
      await http
        .post('/auth/logout')
        .auth(login.body.accessToken, { type: 'bearer' })
        .expect(204);
      await http
        .get('/auth/me')
        .auth(login.body.accessToken, { type: 'bearer' })
        .expect(401);
    } finally {
      try {
        if (bancoConectado)
          await sequelize.query('DELETE FROM usuario WHERE email = :email', {
            replacements: { email },
          });
      } finally {
        if (app) await app.close();
        else if (modulo) await modulo.close();
        if (segredoAnterior === undefined) delete process.env.JWT_SECRET;
        else process.env.JWT_SECRET = segredoAnterior;
      }
    }
  },
);
