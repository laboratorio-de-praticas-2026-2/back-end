import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Faq } from '../../models/faq.model.js';
import { FaqController } from './faq.controller.js';
import { FaqService } from './faq.service.js';

@Module({
  imports: [SequelizeModule.forFeature([Faq])],
  controllers: [FaqController],
  providers: [FaqService],
})
export class FaqModule {}