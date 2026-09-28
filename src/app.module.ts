import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CloudinaryModule } from './cloudinary/cloudinary.module.js';
import { RelatoriosModule } from './modules/relatorios/relatorios.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ContatoModule } from './modules/contato/contato.module.js';
import { DisparoModule } from './modules/contato/disparo/disparo.module.js';
import { MensagemModule } from './modules/contato/mensagem/mensagem.module.js';
import { DashboardModule } from './modules/dashboard/dashboard.module.js';
import { RelatoriosModule } from './modules/relatorios/relatorios.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

const redisHost = process.env.REDIS_HOST ?? 'localhost';
const redisPort = Number(process.env.REDIS_PORT ?? 6379);

@Module({
  imports: [
    ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: '.env',
}),
    BullModule.forRoot({
      connection: {
        host: redisHost,
        port: Number.isFinite(redisPort) ? redisPort : 6379,
      },
    }),

    CloudinaryModule,

    RelatoriosModule,

    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        dialect: configService.get<string>('DB_DIALECT') as 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: Number(configService.get<string>('DB_PORT')),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        synchronize: false,
        autoLoadModels: true,
      }),
    }),

    ObserveModule.forRoot({
      appKey: 'YOUR_APP_KEY',
      appSecret: 'YOUR_APP_SECRET',
      serviceId: 'back-end',
    }),
    PrismaModule,

    ContatoModule,
    DisparoModule,
    MensagemModule,
    DashboardModule,
    RelatoriosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}