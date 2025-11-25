// Servicio para la gestión de usuarios, login, registro y permisos
import {
  HttpException,
  Injectable, NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginDTO } from 'src/interfaces/login.dto';
import { RegisterDTO } from 'src/interfaces/register.dto';
import { UserI } from 'src/interfaces/user.interface';
import { UserEntity } from '../entities/user.entity';
import { hashSync, compareSync } from 'bcrypt';
import { JwtService } from 'src/jwt/jwt.service';
import dayjs from 'dayjs';
import { AssignRoleDto } from "../interfaces/assignRole.dto";
import { RolesService } from "../roles/roles.service";
import { RequestWithUser } from "../interfaces/request-user";

@Injectable()
export class UsersService {
  // Repositorio de usuarios
  repository = UserEntity;
  // Fallback en memoria para bloqueo cuando la DB no pueda persistir
  private static inMemoryLocks: Map<string, { failed: number; lockedUntil?: Date }> = new Map();
  private readonly MAX_FAILED = 5;
  private readonly LOCK_MINUTES = 15;
  constructor(private jwtService: JwtService, private readonly rolesService: RolesService) {}

  // Refresca el accessToken usando el refreshToken
  async refreshToken(refreshToken: string) {
    return this.jwtService.refreshToken(refreshToken);
  }

  // Verifica si el usuario tiene un permiso específico
  async canDo(user: UserI, permission: string): Promise<boolean> {
    const result = user.permissionCodes.includes(permission);
    if (!result) {
      throw new UnauthorizedException();
    }
    return true;
  }

  // Registro de usuario: crea y guarda el usuario en la base de datos
  async register(body: RegisterDTO) {
    try {
      const user = new UserEntity();
      Object.assign(user, body);
      user.password = hashSync(user.password, 10); // Encripta la contraseña
      await this.repository.save(user);
      return { status: 'created' };
    } catch (error) {
      throw new HttpException('Error de creacion', 500);
    }
  }

  // Login de usuario: valida credenciales y retorna tokens
  async login(body: LoginDTO) {
    const user = await this.findByEmail(body.email);
    if (user == null) {
      throw new UnauthorizedException();
    }

    // Si la cuenta está bloqueada en DB y la fecha de desbloqueo es futura, denegar
    if (user.lockedUntil && dayjs().isBefore(dayjs(user.lockedUntil))) {
      throw new UnauthorizedException(`Account locked until ${user.lockedUntil}`);
    }
    // Si la cuenta está bloqueada en el fallback en memoria, denegar
    const mem = UsersService.inMemoryLocks.get(user.email);
    if (mem && mem.lockedUntil && dayjs().isBefore(dayjs(mem.lockedUntil))) {
      throw new UnauthorizedException(`Account locked until ${mem.lockedUntil}`);
    }

    const compareResult = compareSync(body.password, user.password);
    if (!compareResult) {
      // Intento fallido
      // Intentar incrementar en DB; si falla, usar fallback en memoria
      try {
        user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
        // Si alcanza el umbral, bloquear
        if (user.failedLoginAttempts >= this.MAX_FAILED) {
          user.lockedUntil = dayjs().add(this.LOCK_MINUTES, 'minute').toDate();
        }
        await this.repository.save(user);
      } catch (err) {
        // Persistencia falló: actualizar fallback en memoria
        const prev = UsersService.inMemoryLocks.get(user.email) || { failed: 0 };
        const failed = (prev.failed || 0) + 1;
        const entry: { failed: number; lockedUntil?: Date } = { failed };
        if (failed >= this.MAX_FAILED) {
          entry.lockedUntil = dayjs().add(this.LOCK_MINUTES, 'minute').toDate();
        }
        UsersService.inMemoryLocks.set(user.email, entry);
      }

      // Comprobar bloqueo en DB o memoria
      const nowBlocked = (user.failedLoginAttempts && user.failedLoginAttempts >= this.MAX_FAILED) || ((UsersService.inMemoryLocks.get(user.email) || {}).failed >= this.MAX_FAILED);
      if (nowBlocked) {
        throw new UnauthorizedException('Account locked due to too many failed login attempts');
      }

      throw new UnauthorizedException();
    }

    // Login exitoso: resetear contador y bloqueo (DB y fallback en memoria)
    try {
      user.failedLoginAttempts = 0;
      user.lockedUntil = null;
      await this.repository.save(user);
      // Si se pudo persistir en DB, limpiar fallback en memoria
      UsersService.inMemoryLocks.delete(user.email);
    } catch (err) {
      // Si no se pudo persistir, NO limpiar el fallback en memoria: mantener bloqueo si existiera
      // (evita permitir bypass cuando la DB no puede persistir estados de bloqueo)
    }

    return {
      accessToken: this.jwtService.generateToken({ email: user.email }, 'auth'),
      refreshToken: this.jwtService.generateToken(
        { email: user.email },
        'refresh',
      )
    };
  }
  async findByEmail(email: string): Promise<UserEntity> {
    return await this.repository.findOne({where: {email},relations: ["roles", "roles.permissions"]});
  }

  async assignRoles(id: number, assignRoleDto: AssignRoleDto): Promise<UserEntity> {
    const user = await this.findById(id);

    const roles= await  Promise.all(assignRoleDto.roleIds.map((roleId)=> this.rolesService.findById(roleId)));

    if(!user.roles) {
      user.roles = roles;
    } else {
      user.roles= [...user.roles, ...roles];
    }

    return await this.repository.save(user);
  }

  async removeRole(id:number, roleId:number): Promise<{message: string}> {
    const user = await this.findById(id);

    await this.rolesService.findById(roleId);

    user.roles = user.roles.filter(role => role.id !== roleId);

    await this.repository.save(user);

    return {message: 'Rol eliminado'};
  }

  async findById(id: number): Promise<UserEntity> {
    // Devolver la entidad completa con relaciones para operaciones posteriores
    const user = await this.repository.findOne({ where: { id }, relations: ["roles", "roles.permissions"] });
    if(!user) {
      throw new NotFoundException('El usuario no existe');
    }
    return user;
  }

}