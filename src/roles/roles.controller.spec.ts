import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';

describe('RolesController', () => {
  let controller: RolesController;
  let service: any;

  beforeEach(() => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
    } as any;
    controller = new RolesController(service);
  });

  it('debería crear un rol', async () => {
    const dto = { name: 'admin' };
    service.create.mockResolvedValue({ id: 1, ...dto });

    const result = await controller.create(dto);
    expect(result).toEqual({ id: 1, ...dto });
  });

  it('debería devolver todos los roles', async () => {
    service.findAll.mockResolvedValue([{ id: 1, name: 'admin' }]);
    const result = await controller.findAll();
    expect(result).toHaveLength(1);
  });
});
