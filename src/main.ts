import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module.js';

async function bootstrap() {
  const observeEnabled = Boolean(
  process.env.OBSERVE_APP_KEY && process.env.OBSERVE_APP_SECRET,
);

const app = await NestFactory.create(
  AppModule,
  observeEnabled ? { instrument: ObserveInstrument } : {},
);


  await app.listen(process.env.PORT ?? 3333);
}

await bootstrap();
