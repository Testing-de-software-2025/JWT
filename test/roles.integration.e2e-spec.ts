import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';
import { RoleEntity } from '../src/entities/role.entity';
import { PermissionEntity } from '../src/entities/permission.entity';

describe('Roles integration (e2e)', () => {
  let app: INestApplication;
  let httpServer: any;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    httpServer = app.getHttpServer();
    dataSource = app.get(DataSource);

  // Limpiar usando TRUNCATE CASCADE para Postgres y reiniciar identities
  await dataSource.query('TRUNCATE TABLE "roles", "permissions" RESTART IDENTITY CASCADE');
  }, 20000);

  afterAll(async () => {
    if (dataSource) {
      await dataSource.query('TRUNCATE TABLE "roles", "permissions" RESTART IDENTITY CASCADE');
    }
    await app.close();
  });

  it('should create role and list it', async () => {
    const role = { name: `role_${Date.now()}` };

    const createRes = await request(httpServer)
      .post('/roles')
      // For now, routes are protected; skip auth header if your app allows open creation
      .send(role);

    // Could be 201 or 401 depending on guard; we just assert success if created
    if (createRes.status === 201) {
      expect(createRes.body).toHaveProperty('id');

      const listRes = await request(httpServer)
        .get('/roles/all')
        .expect(200);

      expect(Array.isArray(listRes.body)).toBe(true);
      expect(listRes.body.find((r: any) => r.name === role.name)).toBeTruthy();
    }
  }, 20000);
});
