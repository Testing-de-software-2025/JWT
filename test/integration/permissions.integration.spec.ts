import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { DataSource } from 'typeorm';
import { PermissionsService } from '../../src/permissions/permissions.service';
import { PermissionEntity } from '../../src/entities/permission.entity';

describe('Permissions integration tests (integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let permissionsService: PermissionsService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = app.get(DataSource);
    permissionsService = app.get(PermissionsService);

    await dataSource.query('TRUNCATE TABLE "permissions", "roles" RESTART IDENTITY CASCADE;');
  }, 20000);

  afterAll(async () => {
    if (dataSource) await dataSource.query('TRUNCATE TABLE "permissions", "roles" RESTART IDENTITY CASCADE;');
    await app.close();
  });

  it('should create and find permission via service', async () => {
    const permission = await permissionsService.create({ name: `int_perm_${Date.now()}` } as any);
    expect(permission).toHaveProperty('id');

    const found = await permissionsService.findById(permission.id);
    expect(found).toBeDefined();
    expect(found.id).toBe(permission.id);
  }, 20000);

  it('should update a permission via service', async () => {
    const permission = await permissionsService.create({ name: `int_perm_${Date.now()}` } as any);

    const updated = await permissionsService.update(permission.id, { name: `${permission.name}_v2` } as any);
    expect(updated).toBeDefined();
    expect(updated.name).toBe(`${permission.name}_v2`);

    const found = await permissionsService.findById(permission.id);
    expect(found.name).toBe(`${permission.name}_v2`);
  });

  it('should delete a permission via service', async () => {
    const permission = await permissionsService.create({ name: `int_perm_${Date.now()}` } as any);

    await permissionsService.delete(permission.id);

    // findById throws NotFoundException when not found — assert the promise rejects
    await expect(permissionsService.findById(permission.id)).rejects.toBeDefined();
  });
});
