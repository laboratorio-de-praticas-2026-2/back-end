import { Empresa } from './models/empresa.model.js';
import { SearchModule } from './modules/search/search.module.js';
import { HeaderModule } from './modules/header/header.module.js';
import { PublicidadeModule } from './modules/cms/publicidade/publicidade.module.js';
import { ServicosModule } from './modules/cms/servicos/servicos.module.js';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { ContatoModule } from './modules/contato/contato.module.js';
import { DisparoModule } from './modules/contato/disparo/disparo.module.js';
import { MensagemModule } from './modules/contato/mensagem/mensagem.module.js';
import { BlogModule } from './modules/blog/blog.module.js';
import { FaqModule } from './modules/faq/faq.module.js';
import { ChatModule } from './modules/chat/chat.module.js';
import { DashboardModule } from './modules/dashboard/dashboard.module.js';
import { AgendamentoModule } from './modules/agendamento/agendamento.module.js';
import { AgendamentoModel } from './models/agendamento.model.js';
import { TipoAtendimentoModel } from './models/tipo-atendimento.model.js';
import { ClienteModule } from './modules/cliente/cliente.module.js';
import { AdministracaoModule } from './modules/administracao/administracao.module.js';
import { Usuario } from './models/usuario.model.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

const observeEnabled =
  !!process.env.OBSERVE_APP_KEY &&
  !!process.env.OBSERVE_APP_SECRET;

const observeImports =
  process.env.OBSERVE_ENABLED === 'true'
    ? [
        ObserveModule.forRoot({
          appKey: 'YOUR_APP_KEY',
          appSecret: 'YOUR_APP_SECRET',
          serviceId: 'back-end',
        }),
      ]
    : [];

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

        models: [
          AgendamentoModel,
          TipoAtendimentoModel,
          Usuario,
          Empresa,
        ],

        synchronize: true,
      }),
    }),

    ...observeImports,

    ...(observeEnabled
      ? [
          ObserveModule.forRoot({
            appKey: process.env.OBSERVE_APP_KEY!,
            appSecret: process.env.OBSERVE_APP_SECRET!,
            serviceId: 'back-end',
          }),
        ]
      : []),

    AuthModule,
    ContatoModule,
    DisparoModule,
    MensagemModule,
    BlogModule,
    FaqModule,
    ChatModule,
    DashboardModule,
    AgendamentoModule,
    ClienteModule,
    AdministracaoModule,
    SearchModule,
    HeaderModule,
    PublicidadeModule,
    ServicosModule,
  ],

  controllers: [AppController],

  providers: [AppService],
})
export class AppModule {}