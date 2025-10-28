# Explicación línea por línea: test/integration/users.integration.spec.ts

Este archivo contiene pruebas de integración que ejercitan los servicios de usuarios, roles y permisos juntos (flujo de alto nivel).

import { Test, TestingModule } from '@nestjs/testing';
- Import para crear el TestingModule.

import { INestApplication } from '@nestjs/common';
- Tipo de la app Nest que se levantará.

import { AppModule } from '../../src/app.module';
- Se importa el módulo principal para levantar el contexto real.

import { DataSource } from 'typeorm';
- DataSource para limpieza (queries SQL directas entre tests).

import { UsersService } from '../../src/users/users.service';
import { RolesService } from '../../src/roles/roles.service';
import { PermissionsService } from '../../src/permissions/permissions.service';
- Importa los servicios públicos que se usarán en las pruebas.

import { UserEntity } from '../../src/entities/user.entity';
- Entidad User (referencia para comprender relaciones y estructura).

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
    // Registra un usuario usando UsersService y verifica el status.

    const user = await usersService.findByEmail(dto.email);
    expect(user).toBeDefined();
    expect(user.email).toBe(dto.email);
    // Consulta pública del servicio para comprobar persistencia.
  }, 20000);

  it('assignRoles should attach role to user', async () => {
    const email = `int_user_roles_${Date.now()}@test.com`;
    await usersService.register({ email, password: 'p' } as any);
    const user = await usersService.findByEmail(email);
    const role = await rolesService.create({ name: `r_${Date.now()}` } as any);

    const updated = await usersService.assignRoles(user.id, { roleIds: [role.id] } as any);
    expect(updated.roles).toBeDefined();
    expect(updated.roles.find(r => r.id === role.id)).toBeTruthy();
    // Crea un rol, lo asigna al usuario y verifica la relación roles en el usuario.
  }, 20000);

  it('full user-role-permission flow', async () => {
    // create permission via service (use public interface)
    const permissionsService = app.get(PermissionsService) as any;
    const perm = await permissionsService.create({ name: `p_${Date.now()}` } as any);
    expect(perm).toHaveProperty('id');
    // Crea un permiso a través del servicio de permisos.

    // create role and assign permission
    const role = await rolesService.create({ name: `role_full_${Date.now()}` } as any);
    const roleWithPerm = await rolesService.assignPermissions(role.id, { permissionIds: [perm.id] } as any);
    expect(roleWithPerm.permissions.some((p: any) => p.id === perm.id)).toBeTruthy();
    // Crea un rol y le asigna el permiso creado.

    // create user and assign role
    const email = `int_full_${Date.now()}@test.com`;
    await usersService.register({ email, password: 'p' } as any);
    const user = await usersService.findByEmail(email);
    const updated = await usersService.assignRoles(user.id, { roleIds: [role.id] } as any);
    expect(updated.roles.some((r: any) => r.id === role.id)).toBeTruthy();
    // Crea usuario, le asigna rol, verifica la asignación.

    // verify canDo
    const freshUser = await usersService.findById(user.id);
    const has = await usersService.canDo(freshUser as any, perm.name);
    expect(has).toBe(true);
    // Verifica que el usuario efectivamente tiene el permiso (agregado vía rol).

    // cleanup: remove role from user and remove permission from role
    const afterRemove = await usersService.removeRole(user.id, role.id);
    expect(afterRemove).toHaveProperty('message');

    await rolesService.removePermission(role.id, perm.id);
    // Limpieza: remueve rol del usuario y remueve permiso del rol para dejar DB consistente.
  }, 40000);
});

Notas finales:
- Este test orquesta un flujo real: permisos → roles → usuarios → verificación de autorización. Es una prueba de integración tipica que valida la cooperación entre servicios.
- El uso de `app.get(PermissionsService)` se hace para obtener el servicio desde el contexto de Nest; preferible usar la clase como token en vez de cadenas.
- Los timeouts (20000, 40000) permiten que las operaciones asíncronas y la inicialización de DB ocurran sin interrumpir la prueba.
