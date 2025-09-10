import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';

describe('PermissionsController', () => {
  let controller: PermissionsController;
  let service: any;

  beforeEach(() => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
    } as any;
    controller = new PermissionsController(service);
  });

  it('debería crear un permiso', async () => {
    const dto = { name: 'READ' };
    service.create.mockResolvedValue({ id: 1, ...dto });

    const result = await controller.create(dto);
    expect(result).toEqual({ id: 1, ...dto });
  });

  it('debería devolver todos los permisos', async () => {
    service.findAll.mockResolvedValue([{ id: 1, name: 'READ' }]);
    const result = await controller.findAll();
    expect(result).toHaveLength(1);
  });
});
