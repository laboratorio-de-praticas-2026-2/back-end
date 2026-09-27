import { Test, TestingModule } from '@nestjs/testing';
import { ContatoController } from './contato.controller.js';
import { ContatoService } from './contato.service.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';

describe('ContatoController', () => {
  let controller: ContatoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContatoController],
      providers: [ContatoService],
    })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: () => true,
      })
      .overrideGuard(RolesGuard)
      .useValue({
        canActivate: () => true,
      })
      .compile();

    controller = module.get<ContatoController>(ContatoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});