# Explicación línea por línea: test/integration/roles.integration.spec.ts

Este archivo contiene pruebas de integración para `RolesService`. Aquí se explica cada línea o bloque.

import { Test, TestingModule } from '@nestjs/testing';
- Importa las utilidades de Nest para crear el módulo de pruebas.

import { INestApplication } from '@nestjs/common';
- Tipo para la aplicación Nest que se levantará.

import { AppModule } from '../../src/app.module';
- Importa el módulo principal de la aplicación para montar el contexto real.

import { DataSource } from 'typeorm';
- DataSource para ejecutar queries directas (limpieza entre pruebas).

import { RolesService } from '../../src/roles/roles.service';
- Servicio bajo prueba: RolesService.

import { RoleEntity } from '../../src/entities/role.entity';
- Entidad Role (referencia, útil si se trabajara con repositorios directamente).

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
    // Limpieza inicial para evitar colisiones y problemas de FK.
  }, 20000);

  afterAll(async () => {
    if (dataSource) await dataSource.query('TRUNCATE TABLE "roles", "permissions" RESTART IDENTITY CASCADE;');
    await app.close();
  });

  it('should create and retrieve role', async () => {
    const role = await rolesService.create({ name: `int_role_${Date.now()}` } as any);
    // Crea un rol usando RolesService; Date.now() evita duplicados en runs sucesivos.

    expect(role).toHaveProperty('id');
    // Aserción: el rol fue persistido.

    const found = await rolesService.findById(role.id);
    expect(found).toBeDefined();
    expect(found.id).toBe(role.id);
    // Recupera el rol por id y verifica que coincide con el creado.
  }, 20000);
});

Notas:
- Este test valida el flujo básico de creación y lectura de roles a través del servicio público.
- Si se agregan permisos al rol, conviene crear pruebas adicionales que verifiquen relaciones (roles.permissions).
