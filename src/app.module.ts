import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { entities } from './entities';
import { AuthGuard } from './middlewares/auth.middleware';
import { JwtService } from './jwt/jwt.service';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';
import { PermissionsController } from './permissions/permissions.controller';
import { RolesController } from './roles/roles.controller';
import { RolesService } from './roles/roles.service';
import { PermissionsService } from './permissions/permissions.service';


@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      database: 'authdb',
      host: 'localhost',
      port: 5433,
      username: 'postgres',
      password: 'postgres',
      entities: entities,
      synchronize: true,
    }),
    TypeOrmModule.forFeature(entities),
  ],
  controllers: [AppController, UsersController, PermissionsController, RolesController],
  providers: [UsersService, JwtService, AuthGuard, RolesService, PermissionsService],
})
export class AppModule {}
