import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ContatoModule } from './modules/contato/contato.module.js';
import { DisparoModule } from './modules/contato/disparo/disparo.module.js';
import { MensagemModule } from './modules/contato/mensagem/mensagem.module.js';
import { DashboardModule } from './modules/dashboard/dashboard.module.js';
import { HeaderModule } from './modules/header/header.module.js';
import { SearchModule } from './modules/search/search.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

// Observe só é ativado se as credenciais estiverem preenchidas no .env
const observeEnabled =
  !!process.env.OBSERVE_APP_KEY && !!process.env.OBSERVE_APP_SECRET;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

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

    // Observe só é registrado se OBSERVE_APP_KEY e OBSERVE_APP_SECRET existirem no .env
    ...(observeEnabled
      ? [
          ObserveModule.forRoot({
            appKey: process.env.OBSERVE_APP_KEY!,
            appSecret: process.env.OBSERVE_APP_SECRET!,
            serviceId: 'back-end',
          }),
        ]
      : []),

    ContatoModule,
    DisparoModule,
    MensagemModule,
    DashboardModule,
    HeaderModule,
    SearchModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}