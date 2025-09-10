// Servicio para la generación y validación de tokens JWT
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { sign, verify } from 'jsonwebtoken';
import * as dayjs from 'dayjs';
import { Payload } from 'src/interfaces/payload';

@Injectable()
export class JwtService {
  // Configuración de los secretos y expiración de los tokens
  config = {
    auth: {
      secret: 'authSecret', // Secreto para el token de autenticación
      expiresIn: '15m',     // Expira en 15 minutos
    },
    refresh: {
      secret: 'refreshSecret', // Secreto para el refresh token
      expiresIn: '1d',         // Expira en 1 día
    },
  };

  // Genera un token JWT (auth o refresh)
  generateToken(
    payload: { email: string },
    type: 'refresh' | 'auth' = 'auth',
  ): string {
    return sign(payload, this.config[type].secret, {
      expiresIn: this.config[type].expiresIn,
    });
  }

  // Renueva el refresh token si está por expirar
  refreshToken(refreshToken: string): { accessToken: string, refreshToken: string } {
    try {
      const payload = this.getPayload(refreshToken, 'refresh');
      // Obtiene el tiempo restante en minutos hasta la expiración
      const timeToExpire = dayjs.unix(payload.exp).diff(dayjs(), 'minute');
      return {
        accessToken: this.generateToken({ email: payload.email }),
        refreshToken:
          timeToExpire < 5
            ? this.generateToken({ email: payload.email }, 'refresh')
            : refreshToken
      };
    } catch (error) {
      throw new UnauthorizedException();
    }
  }

  // Obtiene el payload del token JWT
  getPayload(token: string, type: 'refresh' | 'auth' = 'auth'): Payload {
    return verify(token, this.config[type].secret);
  }

  
  // Verifica y decodifica un token JWT
  verifyToken(token: string, type: 'refresh' | 'auth' = 'auth'): Payload {
    return this.getPayload(token, type);
  }
}
