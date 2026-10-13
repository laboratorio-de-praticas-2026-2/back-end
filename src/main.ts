import 'dotenv/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import { Sequelize } from 'sequelize-typescript';
import { AppModule, ObserveInstrument } from './app.module.js';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Observe só é ativado se as credenciais estiverem no .env
  const observeEnabled =
    !!process.env.OBSERVE_APP_KEY && !!process.env.OBSERVE_APP_SECRET;

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    ...(observeEnabled && { instrument: ObserveInstrument }),
  });

  app.enableCors();

  // Frontend estático do portal (Relatórios e Simulador) — pasta `web/`.
  // A URL base da API é configurável por PORTAL_API_BASE_URL (vazio = mesma origem).
  app.use('/portal/config.js', (_req: unknown, res: any) => {
    res
      .type('application/javascript')
      .set('Cache-Control', 'no-store')
      .send(
        `window.__PORTAL_CONFIG__ = ${JSON.stringify({
          apiBaseUrl: process.env.PORTAL_API_BASE_URL ?? '',
        })};`,
      );
  });
  app.useStaticAssets(join(process.cwd(), 'web'), { prefix: '/portal/' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const port = process.env.PORT ?? 3333;
  await app.listen(port);

  // Teste de conexão com o banco
  try {
    const sequelize = app.get(Sequelize);
    await sequelize.authenticate();
    logger.log('🟩 Conexão com o banco estabelecida');
  } catch (err) {
    logger.error('❌ Falha ao conectar no banco', err);
  }

  // Logs da API
  logger.log(`🚀 API rodando em http://localhost:${port}`);
  logger.log(`🌎 Ambiente: ${process.env.NODE_ENV ?? 'development'}`);
  logger.log(
    `🗄️ Banco: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  );
  logger.log(
    `📡 Observe: ${observeEnabled ? 'ativado' : 'desativado (sem credenciais)'}`,
  );
}

bootstrap();
