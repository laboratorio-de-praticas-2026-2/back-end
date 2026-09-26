import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { JwtUserPayload } from '../../commons/auth.service.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { validarLoginDto } from './dto/login.dto.js';
import { AuthGuard } from './guards/auth.guard.js';
import { SessaoService } from './sessao.service.js';

@Controller('auth')
export class AuthController {
  constructor(@Inject(SessaoService) private readonly sessao: SessaoService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() body: unknown) {
    return this.sessao.login(validarLoginDto(body));
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@CurrentUser() usuario: JwtUserPayload) {
    return this.sessao.me(usuario.id);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AuthGuard)
  logout(@CurrentUser() usuario: JwtUserPayload): void {
    this.sessao.logout(usuario);
  }
}
