import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthService } from '../../commons/auth.service.js';
import { ChatController } from './chat.controller.js';
import { ChatService } from './chat.service.js';
import { Conversa } from './entities/conversa.entity.js';
import { Mensagem } from './entities/mensagem.entity.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { ChatGateway } from './chat.gateway.js';

@Module({
  imports: [SequelizeModule.forFeature([Conversa, Mensagem])],
  controllers: [ChatController],
  providers: [AuthService, ChatService, JwtAuthGuard, ChatGateway],
  exports: [ChatService],
})
export class ChatModule {}
