import { AuthGuard } from './auth.middleware';
import { JwtService } from '../jwt/jwt.service';
import { ExecutionContext } from '@nestjs/common';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let jwtService: JwtService;

  beforeEach(() => {
    jwtService = new JwtService();
    // Se omite usersService y reflector para simplificar el test
    guard = new AuthGuard(jwtService, null as any, null as any);
  });

  function createMockContext(headers: any): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ headers })
      })
    } as any;
  }

  it('debería permitir la request si el token es válido', async () => {
    const payload = { email: 'test@example.com' };
    const token = jwtService.generateToken(payload);
    const context = createMockContext({ authorization: `Bearer ${token}` });
    // Si el método es async, usa await
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });


  it('debería lanzar error si el token es inválido', async () => {
    const context = createMockContext({ authorization: 'Bearer token_invalido' });
    await expect(guard.canActivate(context)).rejects.toThrow();
  });

  it('debería lanzar error si no hay token', async () => {
    const context = createMockContext({});
    await expect(guard.canActivate(context)).rejects.toThrow();
  });


});
