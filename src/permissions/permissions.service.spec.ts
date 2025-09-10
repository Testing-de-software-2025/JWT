import { PermissionsService } from './permissions.service';

describe('PermissionsService', () => {
  let service: PermissionsService;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    };
    service = new PermissionsService(mockRepo);
  });

  it('debería crear un permiso', async () => {
    const dto = { name: 'READ' };
    mockRepo.create.mockReturnValue(dto);
    mockRepo.save.mockResolvedValue({ id: 1, ...dto });

    const result = await service.create(dto);
    expect(result).toHaveProperty('id');
  });

  it('debería devolver todos los permisos', async () => {
    mockRepo.find.mockResolvedValue([{ id: 1, name: 'READ' }]);
    const result = await service.findAll();
    expect(result.length).toBeGreaterThan(0);
  });
});
