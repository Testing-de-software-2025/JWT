// Guard de autenticación y autorización
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RequestWithUser } from 'src/interfaces/request-user';
import { JwtService } from 'src/jwt/jwt.service';
import { UsersService } from 'src/users/users.service';
import { Permissions } from './decorators/permissions.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private reflector: Reflector
  ) {}

  // Método principal que verifica si el usuario puede acceder a la ruta
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      // Obtiene el request HTTP
      const request: RequestWithUser = context.switchToHttp().getRequest();
      // Extrae el token JWT de la cabecera Authorization
      const token = request.headers.authorization.replace('Bearer ', '');
      console.log('Token:', token);
      if (token == null) {
        throw new UnauthorizedException('El token no existe');
      }
      // Obtiene el payload del token
      const payload = this.jwtService.getPayload(token);
      // Busca el usuario por email
      const user = await this.usersService.findByEmail(payload.email);
      // Asigna el usuario al request
      request.user = user;

      // Obtiene los permisos requeridos por la ruta (decorador)
      const permissions = this.reflector.get(Permissions, context.getHandler());

      // Si no hay permisos requeridos, permite el acceso
      if (!permissions || permissions.length === 0) {
        return true;
      }

      // Verifica que el usuario tenga todos los permisos requeridos
      const userPermissions = user.permissionCodes;
      const hasAllPermissions = permissions.every((permission) => userPermissions.includes(permission));

      if (!hasAllPermissions) {
        throw new UnauthorizedException("Insufficient permissions");
      }

      return true;

    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw new ForbiddenException(error.message);
      } else if (error instanceof UnauthorizedException) {
        throw new UnauthorizedException(error.message);
      } else {
        throw new UnauthorizedException('An unexpected error occurred.');
      }
    }
  }
}