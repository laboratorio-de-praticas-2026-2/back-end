import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

let PrismaClientCtor: any;

try {
  ({ PrismaClient: PrismaClientCtor } = require('@prisma/client'));
} catch {
  PrismaClientCtor = class PrismaClientFallback {};
}

@Injectable()
export class PrismaService
  extends PrismaClientCtor
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    if (typeof this.$connect === 'function') {
      await this.$connect();
    }
  }

  async onModuleDestroy() {
    if (typeof this.$disconnect === 'function') {
      await this.$disconnect();
    }
  }
}
