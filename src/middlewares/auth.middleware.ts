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
    private reflector:Reflector
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request: RequestWithUser = context.switchToHttp().getRequest();
      const token = request.headers.authorization.replace('Bearer ','');
      console.log('Token:', token);
      if (token == null) {
        throw new UnauthorizedException('El token no existe');
      }
      const payload = this.jwtService.getPayload(token);
      const user = await this.usersService.findByEmail(payload.email);
      request.user = user;

      
      const permissions = this.reflector.get(Permissions, context.getHandler());

      if (!permissions || permissions.length === 0) {
        return true;
      }

      const userPermissions = user.permissionCodes;
      
      const hasAllPermissions = permissions.every((permission) => userPermissions.includes(permission));

      if (!hasAllPermissions){
        throw new UnauthorizedException("Insufficent permissions");
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