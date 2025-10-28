// Módulo principal de la aplicación NestJS
// Aquí se configuran los imports, controladores y providers globales
import { Module } from '@nestjs/common';
// Controlador principal para status y endpoints base
import { AppController } from './app.controller';
// Importa el módulo de TypeORM para la conexión con la base de datos
import { TypeOrmModule } from '@nestjs/typeorm';
// Importa las entidades que representan las tablas de la base de datos
import { entities } from './entities';
// Guard de autenticación y autorización JWT
import { AuthGuard } from './middlewares/auth.middleware';
// Servicio para la generación y validación de tokens JWT
import { JwtService } from './jwt/jwt.service';
// Controlador y servicio de usuarios
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';
// Controlador y servicio de permisos
import { PermissionsController } from './permissions/permissions.controller';
import { PermissionsService } from './permissions/permissions.service';
// Controlador y servicio de roles
import { RolesController } from './roles/roles.controller';
import { RolesService } from './roles/roles.service';


@Module({
  imports: [
    // Configuración de la base de datos PostgreSQL
    // 'synchronize: true' permite crear las tablas automáticamente en desarrollo
    TypeOrmModule.forRoot({
      // Habilita configuración vía variables de entorno para las pruebas e2e
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5433,
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASS || 'postgres',
      database: process.env.DB_NAME || 'authdb',
      entities: entities,
      synchronize: true,
    }),
    // Importa las entidades para su uso en los repositorios
    TypeOrmModule.forFeature(entities),
  ],
  // Controladores que gestionan las rutas HTTP
  controllers: [AppController, UsersController, PermissionsController, RolesController],
  // Providers: servicios y guards disponibles en toda la app
  providers: [UsersService, JwtService, AuthGuard, RolesService, PermissionsService],
})
// Exporta el módulo principal
export class AppModule {}
