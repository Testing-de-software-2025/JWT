import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from 'src/jwt/jwt.service';
import { UsersService } from 'src/users/users.service';
import { Request } from 'express';
import { UserEntity } from 'src/entities/user.entity';

@Injectable() // Añadir el decorador Injectable
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService, 
    private readonly userService: UsersService
  ){}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request: Request & { user: UserEntity } = context.switchToHttp().getRequest();
      const authorizationHeader = request.headers.authorization;
    
      if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('Invalid Authorization header');
      }
    
      const token = authorizationHeader.split(' ')[1];
    
      if (!token) {
        throw new UnauthorizedException('Token not found');
      }
    
      const payload = await this.jwtService.getPayload(token);
      const user = await this.userService.findByEmail(payload.email);
      request.user = user;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}