import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Blog } from '../../models/blog.model.js';
import { BlogController } from './blog.controller.js';
import { BlogService } from './blog.service.js';

@Module({
  imports: [SequelizeModule.forFeature([Blog])],
  controllers: [BlogController],
  providers: [BlogService],
})
export class BlogModule {}