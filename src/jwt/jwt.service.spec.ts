import { JwtService } from './jwt.service';

describe('JwtService', () => {
  let service: JwtService;

  beforeEach(() => {
    service = new JwtService();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debería generar un token JWT válido', () => {
  const payload = { email: 'test@example.com' };
  const token = service.generateToken(payload);
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(10);
  });

  it('debería verificar un token válido', () => {
  const payload = { email: 'test@example.com' };
  const token = service.generateToken(payload);
  const decoded = service.verifyToken(token);
  expect(decoded.email).toBe(payload.email);
  });

  it('debería lanzar error al verificar un token inválido', () => {
  expect(() => service.verifyToken('token_invalido')).toThrow();
  });
});
