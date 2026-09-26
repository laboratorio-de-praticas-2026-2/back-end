import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { AppModule, ObserveInstrument } from './app.module.js';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Observe só é ativado se as credenciais estiverem no .env
  const observeEnabled =
    !!process.env.OBSERVE_APP_KEY && !!process.env.OBSERVE_APP_SECRET;

  const app = await NestFactory.create(AppModule, {
    ...(observeEnabled && { instrument: ObserveInstrument }),
  });
  app.enableCors();

  const port = process.env.PORT ?? 3333;
  await app.listen(port);

  // Teste de conexão com o banco
  try {
    const sequelize = app.get(Sequelize);
    await sequelize.authenticate();
    logger.log('✅ Conexão com o banco estabelecida');
  } catch (err) {
    logger.error('❌ Falha ao conectar no banco', err);
  }

  // Logs da API
  logger.log(`🚀 API rodando em http://localhost:${port}`);
  logger.log(`🌍 Ambiente: ${process.env.NODE_ENV ?? 'development'}`);
  logger.log(
    `🗄️  Banco: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  );
  logger.log(
    `📊 Observe: ${observeEnabled ? 'ativado' : 'desativado (sem credenciais)'}`,
  );
}

await bootstrap();