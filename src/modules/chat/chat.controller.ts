import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtUserPayload } from '../../commons/auth.service.js';
import { CreateConversaDto } from './dto/create-conversa.dto.js';
import { UpdateStatusConversaDto } from './dto/update-status-conversa.dto.js';
import { ChatService } from './chat.service.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';

type AuthenticatedRequest = Request & { user: JwtUserPayload };

@Controller('chat/conversas')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  criar(@Body() dto: CreateConversaDto, @Req() request: AuthenticatedRequest) {
    return this.chatService.criarConversa(dto, request.user);
  }

  @Get()
  listar(@Req() request: AuthenticatedRequest) {
    return this.chatService.listarConversas(request.user);
  }

  @Get(':id')
  buscar(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.chatService.buscarConversa(id, request.user);
  }

  @Patch(':id/status')
  atualizarStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateStatusConversaDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.chatService.atualizarStatus(id, dto, request.user);
  }
}
