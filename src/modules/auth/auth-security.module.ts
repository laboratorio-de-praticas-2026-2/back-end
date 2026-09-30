import { Global, Module } from '@nestjs/common';
import { AuthService } from '../../commons/auth.service.js';
import { AuthGuard } from './guards/auth.guard.js';
import { TokenDenylistService } from './token-denylist.service.js';

@Global()
@Module({
  providers: [AuthService, AuthGuard, TokenDenylistService],
  exports: [AuthService, AuthGuard, TokenDenylistService],
})
export class AuthSecurityModule {}
