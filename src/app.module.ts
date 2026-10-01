import { Empresa } from './models/empresa.model.js';
import { SearchModule } from './modules/search/search.module.js';
import { HeaderModule } from './modules/header/header.module.js';
import { PublicidadeModule } from './modules/cms/publicidade/publicidade.module.js';
import { ServicosModule } from './modules/cms/servicos/servicos.module.js';
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
import { AuthModule } from './modules/auth/auth.module.js';
import { ContatoModule } from './modules/contato/contato.module.js';
import { DisparoModule } from './modules/contato/disparo/disparo.module.js';
import { MensagemModule } from './modules/contato/mensagem/mensagem.module.js';
import { BlogModule } from './modules/blog/blog.module.js';
import { FaqModule } from './modules/faq/faq.module.js';
import { ChatModule } from './modules/chat/chat.module.js';
import { DashboardModule } from './modules/dashboard/dashboard.module.js';
import { NotificacaoModule } from './modules/notificacao/notificacao.module.js';

import { AgendamentoModule } from './modules/agendamento/agendamento.module.js';
import { AgendamentoModel } from './models/agendamento.model.js';
import { TipoAtendimentoModel } from './models/tipo-atendimento.model.js';
import { ClienteModule } from './modules/cliente/cliente.module.js';
import { AdministracaoModule } from './modules/administracao/administracao.module.js';

import { Usuario } from './models/usuario.model.js';
import { ObrigacaoEmpresa } from './models/obrigacao-empresa.model.js';
import { ObrigacaoServico } from './models/obrigacao-servico.model.js';
import { Obrigacao } from './models/obrigacao.model.js';
import { Pagamento } from './models/pagamento.model.js';
import { Parcela } from './models/parcela.model.js';
import { Solicitacao } from './models/solicitacao.model.js';
import { DocumentoSolicitacao } from './models/documento-solicitacao.model.js';
import { Servico } from './models/servico.model.js';

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
        
        // Ativado o autoLoad para facilitar futuros merges,
        // mas mantendo o registro explicito dos nossos models.
        autoLoadModels: true,

        models: [
          AgendamentoModel,
          TipoAtendimentoModel,
          Usuario,
          Empresa,
          ObrigacaoEmpresa,
          ObrigacaoServico,
          Obrigacao,
          Pagamento,
          Parcela,
          Solicitacao,
          DocumentoSolicitacao,
          Servico,
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
PrismaModule,

    AuthModule,
    ContatoModule,
    DisparoModule,
    MensagemModule,
    BlogModule,
    FaqModule,
    ChatModule,
    DashboardModule,
    NotificacaoModule,
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
export class AppModule { }