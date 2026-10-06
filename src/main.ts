import 'dotenv/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Sequelize } from 'sequelize-typescript';
import { AppModule, ObserveInstrument } from './app.module.js';
import { validationPipe } from './commons/pipes/validation.pipe.js';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Observe só é ativado se as credenciais estiverem no .env
  const observeEnabled =
    !!process.env.OBSERVE_APP_KEY && !!process.env.OBSERVE_APP_SECRET;

  const app = await NestFactory.create(AppModule, {
    ...(observeEnabled && { instrument: ObserveInstrument }),
  });

  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Back-end API')
    .setDescription('Documentacao da API')
    .setVersion('1.0')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument);

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
