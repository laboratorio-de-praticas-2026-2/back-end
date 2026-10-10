import 'dotenv/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestFactory } from '@nestjs/core';
import { Sequelize } from 'sequelize-typescript';
import { AppModule, ObserveInstrument } from './app.module.js';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

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

  const config = new DocumentBuilder()
    .setTitle('API de Relatórios')
    .setDescription('API para gerenciamento e geração de relatórios em PDF')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ?? 3333;
  await app.listen(port);

  try {
    const sequelize = app.get(Sequelize);
    await sequelize.authenticate();
    logger.log('Conexão com o banco estabelecida');
  } catch (err) {
    logger.error(
      `Banco: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
      err instanceof Error ? err.message : String(err),
    );
  }

  logger.log(
    `Observe: ${
      observeEnabled ? 'ativado' : 'desativado (sem credenciais)'
    }`,
  );
}

bootstrap();