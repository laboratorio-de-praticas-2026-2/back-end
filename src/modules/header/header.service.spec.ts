import { Test, TestingModule } from '@nestjs/testing';
import { HeaderService } from './header.service.js';

describe('HeaderService', () => {
  let service: HeaderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HeaderService],
    }).compile();

    service = module.get<HeaderService>(HeaderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns the frontend header contract', () => {
    const header = service.getHeader();

    expect(header.logo).toEqual({
      src: '/logo.svg',
      alt: 'Portal Contábil Grupo Bortone',
      href: '/',
    });
    expect(header.menu).toEqual([
      { id: 'home', label: 'Início', href: '/' },
      { id: 'sobre-nos', label: 'Sobre nós', href: '/sobre-nos' },
      { id: 'servicos', label: 'Serviços', href: '/servicos' },
      { id: 'solucoes', label: 'Soluções', href: '/solucoes' },
      { id: 'blog', label: 'Blog', href: '/blog' },
      { id: 'duvidas', label: 'Dúvidas', href: '/duvidas' },
    ]);
    expect(header.buttons).toEqual([
      { id: 'login', label: 'Login', href: '/login', variant: 'primary' },
    ]);
    expect(header.menu).toHaveLength(6);
    expect(header.menu.map((item) => item.id)).toEqual([
      'home',
      'sobre-nos',
      'servicos',
      'solucoes',
      'blog',
      'duvidas',
    ]);
    expect(header.buttons).toContainEqual(
      expect.objectContaining({ id: 'login', href: '/login' }),
    );
    expect(header.menu.every((item) => item.href.length > 0)).toBe(true);
  });

  it('não retorna itens de menu sem href válido', () => {
    const header = service.getHeader();

    header.menu.forEach((item) => {
      expect(item.href).toBeTruthy();
      expect(item.href.trim()).not.toBe('');
    });
  });

  it('não retorna botões sem href válido', () => {
    const header = service.getHeader();

    header.buttons.forEach((item) => {
      expect(item.href).toBeTruthy();
      expect(item.href.trim()).not.toBe('');
    });
  });
});