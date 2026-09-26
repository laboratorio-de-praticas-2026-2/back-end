import { Module } from '@nestjs/common';
import { CryptoUtil } from './crypto.js';
import { Formatters } from './formatters.js';

@Module({
  providers: [CryptoUtil, Formatters],
  exports: [CryptoUtil, Formatters],
})
export class UtilsModule {}