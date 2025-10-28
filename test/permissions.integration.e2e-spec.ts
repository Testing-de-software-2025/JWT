import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';
import { PermissionEntity } from '../src/entities/permission.entity';

describe('Permissions integration (e2e)', () => {
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

    await dataSource.getRepository(PermissionEntity).clear();
  }, 20000);

  afterAll(async () => {
    if (dataSource) await dataSource.getRepository(PermissionEntity).clear();
    await app.close();
  });

  it('should create and list permissions', async () => {
    const permission = { name: `perm_${Date.now()}` };

    const createRes = await request(httpServer)
      .post('/permissions')
      .send(permission);

    if (createRes.status === 201) {
      expect(createRes.body).toHaveProperty('id');

      const listRes = await request(httpServer)
        .get('/permissions/all')
        .expect(200);

      expect(listRes.body.find((p: any) => p.name === permission.name)).toBeTruthy();
    }
  }, 20000);
});
