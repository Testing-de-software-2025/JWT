import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { DataSource } from 'typeorm';
import { RolesService } from '../../src/roles/roles.service';
import { RoleEntity } from '../../src/entities/role.entity';

describe('Roles integration tests (integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let rolesService: RolesService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = app.get(DataSource);
    rolesService = app.get(RolesService);

    await dataSource.query('TRUNCATE TABLE "roles", "permissions" RESTART IDENTITY CASCADE;');
  }, 20000);

  afterAll(async () => {
    if (dataSource) await dataSource.query('TRUNCATE TABLE "roles", "permissions" RESTART IDENTITY CASCADE;');
    await app.close();
  });

  it('should create and retrieve role', async () => {
    const role = await rolesService.create({ name: `int_role_${Date.now()}` } as any);
    expect(role).toHaveProperty('id');

    const found = await rolesService.findById(role.id);
    expect(found).toBeDefined();
    expect(found.id).toBe(role.id);
  }, 20000);
});
