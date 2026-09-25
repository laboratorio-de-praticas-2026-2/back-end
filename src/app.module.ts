import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
// import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ContatoModule } from './modules/contato/contato.module.js';
import { DisparoModule } from './modules/contato/disparo/disparo.module.js';
import { MensagemModule } from './modules/contato/mensagem/mensagem.module.js';
import { DashboardModule } from './modules/dashboard/dashboard.module.js';
import { ServicoModule } from './modules/servico/servico.module.js';
import { Servico } from './modules/servico/servico.js';

// export const { ObserveModule, ObserveInstrument } = createObserveModule();

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
    autoLoadModels: true,
    synchronize: true,
    sync: { alter: true }, // <--- ADICIONA ESTA LINHA PARA ATUALIZAR AS COLUNAS NO MYSQL
  }),
}),

    ContatoModule,
    DisparoModule,
    MensagemModule,
    DashboardModule,
    ServicoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}