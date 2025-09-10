import { RolesService } from './roles.service';

describe('RolesService', () => {
  let service: RolesService;
  let mockRepo: any;
  let mockPermissionsService: any;

  beforeEach(() => {
    mockRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    };
    mockPermissionsService = {
      findById: jest.fn(),
    };
    service = new RolesService(mockPermissionsService, mockRepo);
  });

  it('debería crear un rol', async () => {
    const dto = { name: 'admin' };
    mockRepo.create.mockReturnValue(dto);
    mockRepo.save.mockResolvedValue({ id: 1, ...dto });

    const result = await service.create(dto);
    expect(result).toHaveProperty('id');
  });

  it('debería devolver todos los roles', async () => {
    mockRepo.find.mockResolvedValue([{ id: 1, name: 'admin' }]);
    const result = await service.findAll();
    expect(result.length).toBeGreaterThan(0);
  });
});
