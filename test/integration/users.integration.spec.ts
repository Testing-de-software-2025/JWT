import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { DataSource } from 'typeorm';
import { UsersService } from '../../src/users/users.service';
import { RolesService } from '../../src/roles/roles.service';
import { PermissionsService } from '../../src/permissions/permissions.service';
import { UserEntity } from '../../src/entities/user.entity';

describe('Users integration tests (integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let usersService: UsersService;
  let rolesService: RolesService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = app.get(DataSource);
    usersService = app.get(UsersService);
    rolesService = app.get(RolesService);

    // Limpieza inicial con TRUNCATE para evitar problemas de FK
    await dataSource.query('TRUNCATE TABLE "users", "roles", "permissions" RESTART IDENTITY CASCADE;');
  }, 20000);

  afterAll(async () => {
    if (dataSource) {
      await dataSource.query('TRUNCATE TABLE "users", "roles", "permissions" RESTART IDENTITY CASCADE;');
    }
    await app.close();
  });

  it('register should persist user', async () => {
    const dto = { email: `int_user_${Date.now()}@test.com`, password: 'abcd1234' };
    const res = await usersService.register(dto as any);
    expect(res).toHaveProperty('status', 'created');

    const user = await usersService.findByEmail(dto.email);
    expect(user).toBeDefined();
    expect(user.email).toBe(dto.email);
  }, 20000);

  it('assignRoles should attach role to user', async () => {
    const email = `int_user_roles_${Date.now()}@test.com`;
    await usersService.register({ email, password: 'p' } as any);
    const user = await usersService.findByEmail(email);
    const role = await rolesService.create({ name: `r_${Date.now()}` } as any);

    const updated = await usersService.assignRoles(user.id, { roleIds: [role.id] } as any);
    expect(updated.roles).toBeDefined();
    expect(updated.roles.find(r => r.id === role.id)).toBeTruthy();
  }, 20000);

  it('full user-role-permission flow', async () => {
  // create permission via service (use public interface)
  const permissionsService = app.get(PermissionsService) as any;
  const perm = await permissionsService.create({ name: `p_${Date.now()}` } as any);
    expect(perm).toHaveProperty('id');

    // create role and assign permission
    const role = await rolesService.create({ name: `role_full_${Date.now()}` } as any);
    const roleWithPerm = await rolesService.assignPermissions(role.id, { permissionIds: [perm.id] } as any);
    expect(roleWithPerm.permissions.some((p: any) => p.id === perm.id)).toBeTruthy();

    // create user and assign role
    const email = `int_full_${Date.now()}@test.com`;
    await usersService.register({ email, password: 'p' } as any);
    const user = await usersService.findByEmail(email);
    const updated = await usersService.assignRoles(user.id, { roleIds: [role.id] } as any);
    expect(updated.roles.some((r: any) => r.id === role.id)).toBeTruthy();

    // verify canDo
    const freshUser = await usersService.findById(user.id);
    const has = await usersService.canDo(freshUser as any, perm.name);
    expect(has).toBe(true);

    // cleanup: remove role from user and remove permission from role
    const afterRemove = await usersService.removeRole(user.id, role.id);
    expect(afterRemove).toHaveProperty('message');

    await rolesService.removePermission(role.id, perm.id);
  }, 40000);
});
