# Explicación línea por línea: test/integration/permissions.integration.spec.ts

Este archivo contiene pruebas de integración para el servicio `PermissionsService`. A continuación se explica cada línea o bloque y su propósito.

import { Test, TestingModule } from '@nestjs/testing';

- Importa utilidades de Nest para crear módulos de prueba (Test.createTestingModule).

import { INestApplication } from '@nestjs/common';

- Tipo que representa la aplicación Nest levantada en pruebas.

import { AppModule } from '../../src/app.module';

- Importa el módulo principal de la aplicación para levantar el contexto real (providers, TypeORM, etc.).

import { DataSource } from 'typeorm';

- Permite ejecutar consultas SQL directas (usado aquí para limpiar tablas entre tests).

import { PermissionsService } from '../../src/permissions/permissions.service';

- Importa la clase del servicio que vamos a probar.

import { PermissionEntity } from '../../src/entities/permission.entity';

- Entidad que representa la tabla `permissions` (referencia, no usada directamente en los tests).

describe('Permissions integration tests (integration)', () => {

- Define el bloque de pruebas (suite) con un nombre descriptivo.

  let app: INestApplication;
  let dataSource: DataSource;
  let permissionsService: PermissionsService;

- Variables de contexto que se inicializarán en `beforeAll`.

  beforeAll(async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
  imports: [AppModule],
  }).compile();
  // Crea y compila un TestingModule importando el AppModule real.

      app = moduleFixture.createNestApplication();
      await app.init();
      // Inicializa la aplicación (TypeORM se conecta y sincroniza tablas si está configurado así).

      dataSource = app.get(DataSource);
      permissionsService = app.get(PermissionsService);
      // Obtiene instancias del DataSource y del servicio desde el contexto de Nest.

      await dataSource.query('TRUNCATE TABLE "permissions", "roles" RESTART IDENTITY CASCADE;');
      // Limpieza inicial de tablas para asegurar un estado consistente entre ejecuciones.

  }, 20000);

  afterAll(async () => {
  if (dataSource) await dataSource.query('TRUNCATE TABLE "permissions", "roles" RESTART IDENTITY CASCADE;');
  await app.close();
  // Limpieza final y cierre de la aplicación.
  });

  it('should create and find permission via service', async () => {
  const permission = await permissionsService.create({ name: `int_perm_${Date.now()}` } as any);
  // Crea un permiso a través de la API pública del servicio. Se usa Date.now() para evitar colisiones.

      expect(permission).toHaveProperty('id');
      // Verifica que la entidad creada tiene id (persistida).

      const found = await permissionsService.findById(permission.id);
      expect(found).toBeDefined();
      expect(found.id).toBe(permission.id);
      // Recupera por id y compara que coincide con lo creado.

  }, 20000);

  it('should update a permission via service', async () => {
  const permission = await permissionsService.create({ name: `int_perm_${Date.now()}` } as any);

      const updated = await permissionsService.update(permission.id, { name: `${permission.name}_v2` } as any);
      expect(updated).toBeDefined();
      expect(updated.name).toBe(`${permission.name}_v2`);
      // Actualiza el permiso y verifica el cambio en el objeto retornado.

      const found = await permissionsService.findById(permission.id);
      expect(found.name).toBe(`${permission.name}_v2`);
      // Confirma que la actualización quedó persistida.

  });

  it('should delete a permission via service', async () => {
  const permission = await permissionsService.create({ name: `int_perm_${Date.now()}` } as any);

      await permissionsService.delete(permission.id);
      // Borra el permiso mediante el servicio.

      // findById lanza NotFoundException si no existe — esperamos que la promesa rechace.
      await expect(permissionsService.findById(permission.id)).rejects.toBeDefined();

  });
  });

---

Notas y buenas prácticas:

- Estos tests son integración porque arrancan el `AppModule` real y usan la BD configurada por TypeORM.
- Para evitar flaky tests, se usa TRUNCATE con RESTART IDENTITY CASCADE para limpiar tablas.
- En producción conviene usar DTOs tipados y factories en lugar de `as any`.
