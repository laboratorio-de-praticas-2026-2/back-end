import jwt from 'jsonwebtoken';
import { AuthService } from './auth.service.js';
import { NivelUsuarioEnum } from './constantes/nivel-usuario-enum.js';

const SEGREDO = 'segredo-de-teste-com-mais-de-32-caracteres';
const usuario = {
  id: 7,
  nivel: NivelUsuarioEnum.cliente,
  nome: 'Maria',
  email: 'maria@teste.com',
};

describe('AuthService (JWT)', () => {
  const envOriginal = { ...process.env };
  let service: AuthService;

  beforeEach(() => {
    process.env.JWT_SECRET = SEGREDO;
    delete process.env.JWT_EXPIRES_IN;
    service = new AuthService();
  });

  afterEach(() => {
    process.env = { ...envOriginal };
    vi.useRealTimers();
  });

  it('emite token que volta com id, nível e jti', () => {
    const { accessToken, expiresIn } = service.signToken(usuario);
    const payload = service.verifyToken(accessToken);

    expect(expiresIn).toBe(3600);
    expect(payload).toMatchObject(usuario);
    expect(typeof payload?.jti).toBe('string');
  });

  it('respeita JWT_EXPIRES_IN', () => {
    process.env.JWT_EXPIRES_IN = '120';
    expect(service.signToken(usuario).expiresIn).toBe(120);
  });

  it('rejeita token ausente, adulterado ou assinado com outro segredo', () => {
    const { accessToken } = service.signToken(usuario);
    const adulterado = accessToken.slice(0, -2) + 'xx';
    const outroSegredo = jwt.sign({ id: 1, nivel: 'administrador', jti: 'a' }, 'outro');

    expect(service.verifyToken(undefined)).toBeNull();
    expect(service.verifyToken('')).toBeNull();
    expect(service.verifyToken(adulterado)).toBeNull();
    expect(service.verifyToken(outroSegredo)).toBeNull();
  });

  it('rejeita token expirado', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const { accessToken } = service.signToken(usuario);

    vi.setSystemTime(new Date('2026-01-01T02:00:00Z'));
    expect(service.verifyToken(accessToken)).toBeNull();
  });

  it('rejeita token com nível desconhecido', () => {
    const token = jwt.sign({ id: 1, nivel: 'root', jti: 'a' }, SEGREDO);
    expect(service.verifyToken(token)).toBeNull();
  });

  it('falha ao iniciar sem JWT_SECRET (sem segredo padrão inseguro)', () => {
    delete process.env.JWT_SECRET;
    expect(() => service.onModuleInit()).toThrow('JWT_SECRET');
    expect(() => service.signToken(usuario)).toThrow('JWT_SECRET');
  });
});
