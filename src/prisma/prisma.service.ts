import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client.js';
import 'dotenv/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    const connectionString =
      process.env.DATABASE_URL ??
      buildDatabaseUrl({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
      });

    if (!connectionString) {
      throw new Error(
        'Configuração do banco ausente. Defina DATABASE_URL ou DB_HOST, DB_PORT, DB_USER, DB_PASSWORD e DB_NAME no arquivo .env.',
      );
    }

    const adapter = new PrismaMariaDb(connectionString);

    super({ adapter });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

function buildDatabaseUrl(config: {
  host?: string;
  port?: string;
  user?: string;
  password?: string;
  database?: string;
}) {
  if (
    !config.host ||
    !config.port ||
    !config.user ||
    !config.password ||
    !config.database
  ) {
    return undefined;
  }

  const user = encodeURIComponent(config.user);
  const password = encodeURIComponent(config.password);

  return `mysql://${user}:${password}@${config.host}:${config.port}/${config.database}`;
}