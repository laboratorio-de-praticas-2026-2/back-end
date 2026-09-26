import { Module } from '@nestjs/common';
import { HeaderController } from './header.controller.js';
import { HeaderService } from './header.service.js';

@Module({
  controllers: [HeaderController],
  providers: [HeaderService],
  exports: [HeaderService],
})
export class HeaderModule {}