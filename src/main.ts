import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module.js';

async function bootstrap() {

  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });
  app.enableCors();

  //const observeEnabled = Boolean(
 // process.env.OBSERVE_APP_KEY && process.env.OBSERVE_APP_SECRET,
//);



  await app.listen(process.env.PORT ?? 3333);
}

await bootstrap();
