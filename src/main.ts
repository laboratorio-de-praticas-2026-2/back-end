import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module.js';
import { validationPipe } from './commons/pipes/validation.pipe.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });
  app.enableCors();
  app.useGlobalPipes(validationPipe);
  await app.listen(process.env.PORT ?? 3333);
}
await bootstrap();
