import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { UserEntity } from 'src/entities/user.entity';
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
      throw new UnauthorizedException(error?.message);
    }
  }
}