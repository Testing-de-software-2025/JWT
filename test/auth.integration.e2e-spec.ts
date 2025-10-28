import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';
import { UserEntity } from '../src/entities/user.entity';
import { RoleEntity } from '../src/entities/role.entity';
import { PermissionEntity } from '../src/entities/permission.entity';

describe('Auth integration (e2e)', () => {
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
    // Obtener el DataSource inicializado por TypeORM
    dataSource = app.get(DataSource);

  // Asegurar DB limpia antes de ejecutar (usar TRUNCATE con CASCADE para Postgres)
  await dataSource.query('TRUNCATE TABLE "users", "roles", "permissions" RESTART IDENTITY CASCADE');
  }, 20000);

  afterAll(async () => {
    if (dataSource) {
      await dataSource.query('TRUNCATE TABLE "users", "roles", "permissions" RESTART IDENTITY CASCADE');
    }
    await app.close();
  });

  it('should register -> login -> access protected /me -> refresh token', async () => {
    const user = { email: `e2e_${Date.now()}@example.com`, password: 'pass1234' };

    // Register
    const registerRes = await request(httpServer)
      .post('/register')
      .send(user)
      .expect(201);

    expect(registerRes.body).toBeDefined();
    expect(registerRes.body.status).toBe('created');

    // Login
    const loginRes = await request(httpServer)
      .post('/login')
      .send({ email: user.email, password: user.password })
      .expect(201);

    expect(loginRes.body).toHaveProperty('accessToken');
    expect(loginRes.body).toHaveProperty('refreshToken');

    const { accessToken, refreshToken } = loginRes.body;

    // Access protected route /me
    const meRes = await request(httpServer)
      .get('/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(meRes.body).toHaveProperty('email', user.email);

    // Refresh token endpoint (expects refresh-token header)
    const refreshRes = await request(httpServer)
      .get('/refresh-token')
      .set('refresh-token', refreshToken)
      .expect(200);

    expect(refreshRes.body).toHaveProperty('accessToken');
    expect(refreshRes.body).toHaveProperty('refreshToken');
  }, 20000);
});
