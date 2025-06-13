import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { entities } from './entities';
import { JwtModule } from './jwt/jwt.module';
import { AuthModule } from './auth/auth.module';
import { PermissionsModule } from './permissions/permissions.module';
import { RolesModule } from './roles/roles.module';
import { UsersModule } from './users/users.module';
import { LoginModule } from './login/login.module';
import { RefreshModule } from './refresh/refresh.module';


@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      database: 'authdb',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      entities: entities,
      synchronize: true,
    }),
    JwtModule,
    AuthModule,
    PermissionsModule,
    RolesModule,
    UsersModule,
    LoginModule, 
    RefreshModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
