import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Faq } from '../models/faq.model'; 
import { FaqController } from './faq.controller';
import { FaqService } from './faq.service';

@Module({
  imports: [SequelizeModule.forFeature([Faq])],
  controllers: [FaqController],
  providers: [FaqService]
})
export class FaqModule {}