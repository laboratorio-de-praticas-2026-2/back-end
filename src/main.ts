import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module.js';

async function bootstrap() {
<<<<<<< HEAD
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });
  app.enableCors();
=======
  const observeEnabled = Boolean(
  process.env.OBSERVE_APP_KEY && process.env.OBSERVE_APP_SECRET,
);

const app = await NestFactory.create(
  AppModule,
  observeEnabled ? { instrument: ObserveInstrument } : {},
);


>>>>>>> 60428eb (Feat: Realização de teste)
  await app.listen(process.env.PORT ?? 3333);
}

await bootstrap();
