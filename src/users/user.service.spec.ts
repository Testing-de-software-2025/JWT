import { UsersService } from './users.service';
import { JwtService } from '../jwt/jwt.service';
import { hashSync } from 'bcrypt';

describe('UsersService', () => {
  let service: UsersService;
  let jwtService: JwtService;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    };
    jwtService = new JwtService();
  const mockRolesService: any = { findById: jest.fn() };
  service = new UsersService(jwtService, mockRolesService);
  // Inyectar el repo mockeado en la instancia
  (service as any).repository = mockRepo;
  });

  it('debería registrar un usuario', async () => {
    const dto = { email: 'test@example.com', password: '1234' };
    mockRepo.create.mockReturnValue(dto);
    mockRepo.save.mockResolvedValue({ id: 1, ...dto });

    const result = await service.register(dto as any);
    // register devuelve { status: 'created' }
    expect(result).toHaveProperty('status', 'created');
    expect(mockRepo.save).toHaveBeenCalled();
  });

  it('debería loguear un usuario válido', async () => {
    const dto = { email: 'test@example.com', password: '1234' };
    // Simular que findByEmail devuelve un usuario con la contraseña hasheada
    const hashed = hashSync(dto.password, 10);
    jest.spyOn(service, 'findByEmail' as any).mockResolvedValue({ id: 1, email: dto.email, password: hashed } as any);

    const result = await service.login(dto as any);
    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
  });

  it('debería lanzar error con credenciales inválidas', async () => {
    jest.spyOn(service, 'findByEmail' as any).mockResolvedValue(null);
    await expect(service.login({ email: 'fail@example.com', password: 'wrong' } as any))
      .rejects.toThrow();
  });

  it('debería bloquear la cuenta tras 5 intentos fallidos y rechazar un login correcto hasta el desbloqueo', async () => {
    const email = 'block@test.com';
    const plain = 'correct123';
    const hashed = hashSync(plain, 10);

    // Estado persistido simulado
    const persisted: any = { id: 99, email, password: hashed, failedLoginAttempts: 0, lockedUntil: null };

    // Mock del repositorio para soportar findOne por email o id, increment y update
    const mockRepo: any = {
      findOne: jest.fn().mockImplementation(async (query: any) => {
        const where = query && query.where;
        if (where && where.email) return persisted;
        if (where && where.id) return persisted;
        return null;
      }),
      increment: jest.fn().mockImplementation(async (_where: any, _field: string, val: number) => {
        persisted.failedLoginAttempts = (persisted.failedLoginAttempts || 0) + val;
        return Promise.resolve();
      }),
      update: jest.fn().mockImplementation(async (_where: any, data: any) => {
        if (data.failedLoginAttempts !== undefined) persisted.failedLoginAttempts = data.failedLoginAttempts;
        if (data.lockedUntil !== undefined) persisted.lockedUntil = data.lockedUntil;
        return Promise.resolve();
      }),
    };

    // Inyectar repo mockeado
    (service as any).repository = mockRepo;

    // 5 intentos fallidos
    for (let i = 1; i <= 5; i++) {
      await expect(service.login({ email, password: 'wrongpass' } as any)).rejects.toThrow();
    }

    // Tras 5 fallos, debe estar bloqueada en persisted
    expect(persisted.failedLoginAttempts).toBeGreaterThanOrEqual(5);
    expect(persisted.lockedUntil).not.toBeNull();

    // Intento con contraseña correcta debe ser rechazado por bloqueo
    await expect(service.login({ email, password: plain } as any)).rejects.toThrow('Account locked');

    // Simular expiración del lock (reset manual) y permitir login
    persisted.failedLoginAttempts = 0;
    persisted.lockedUntil = null;
    // Mockear jwtService para no depender de implementación real
    jest.spyOn(jwtService, 'generateToken' as any).mockImplementation(() => 'tok');

    const result = await service.login({ email, password: plain } as any);
    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
  });
});
