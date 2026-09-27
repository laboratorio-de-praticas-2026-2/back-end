import { Module } from '@nestjs/common';
import { FileConversorService } from './file-conversor.service.js';

@Module({
  providers: [FileConversorService],
})
export class FileConversorModule {}