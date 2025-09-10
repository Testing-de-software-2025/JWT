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
});
