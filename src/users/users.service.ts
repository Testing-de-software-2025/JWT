import {
  HttpException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginDTO } from 'src/interfaces/login.dto';
import { RegisterDTO } from 'src/interfaces/register.dto';
import { UserI } from 'src/interfaces/user.interface';
import { UserEntity } from '../entities/user.entity';
import { hashSync, compareSync } from 'bcrypt';
import { JwtService } from 'src/jwt/jwt.service';
import { AssignRoleDto } from '../interfaces/assignRole.dto';
import { RolesService } from '../roles/roles.service';
const dayjs = require('dayjs');

@Injectable()
export class UsersService {
  // Repositorio (Active Record pattern)
  repository = UserEntity;

  // Constantes de seguridad
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCK_DURATION_MINUTES = 2;

  constructor(
    private jwtService: JwtService,
    private readonly rolesService: RolesService,
  ) {}

  async refreshToken(refreshToken: string) {
    return this.jwtService.refreshToken(refreshToken);
  }

  async canDo(user: UserI, permission: string): Promise<boolean> {
    const result = user.permissionCodes.includes(permission);
    if (!result) {
      throw new UnauthorizedException();
    }
    return true;
  }

  async register(body: RegisterDTO) {
    try {
      const user = new UserEntity();
      Object.assign(user, body);
      user.password = hashSync(user.password, 10);
      await this.repository.save(user);
      return { status: 'created' };
    } catch (error) {
      throw new HttpException('Error de creacion', 500);
    }
  }

  // --- LOGIN OPTIMIZADO ---
  async login(body: LoginDTO) {
    const user = await this.findByEmail(body.email);

    // 1. Si el usuario no existe, devolvemos error genérico por seguridad
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 2. VERIFICAR SI LA CUENTA ESTÁ BLOQUEADA ACTUALMENTE
    if (user.lockedUntil) {
      const isLocked = dayjs().isBefore(dayjs(user.lockedUntil));
      if (isLocked) {
        const expiresAt = dayjs(user.lockedUntil).format('HH:mm:ss');
        throw new UnauthorizedException(
          `Cuenta bloqueada temporalmente por seguridad. Intente nuevamente a las ${expiresAt}`,
        );
      } else {
        // Si tenía fecha de bloqueo pero YA PASÓ el tiempo, reseteamos flags silenciosamente
        // para dar una nueva oportunidad limpia.
        user.lockedUntil = null;
        user.failedLoginAttempts = 0;
        // No guardamos aún para ahorrar una query, se guardará tras validar pass o fallar
      }
    }

    // 3. VALIDAR CONTRASEÑA
    const isPasswordValid = compareSync(body.password, user.password);

    if (!isPasswordValid) {
      // --- MANEJO DE ERROR DE CONTRASEÑA ---
      
      // Incrementamos intentos
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

      // Verificamos si alcanzó el límite
      if (user.failedLoginAttempts >= this.MAX_FAILED_ATTEMPTS) {
        // Bloquear por 15 minutos
        user.lockedUntil = dayjs().add(this.LOCK_DURATION_MINUTES, 'minute').toDate();
        await this.repository.save(user);
        
        throw new UnauthorizedException(
          `Has excedido el número de intentos. Tu cuenta ha sido bloqueada por ${this.LOCK_DURATION_MINUTES} minutos.`,
        );
      }

      // Guardamos el incremento de intentos fallidos
      await this.repository.save(user);
      
      const remaining = this.MAX_FAILED_ATTEMPTS - user.failedLoginAttempts;
      throw new UnauthorizedException(`Contraseña incorrecta. Te quedan ${remaining} intentos.`);
    }

    // 4. LOGIN EXITOSO
    // Si llegamos aquí, la contraseña es correcta y la cuenta no está bloqueada.
    // Reseteamos cualquier contador de fallos previo.
    if (user.failedLoginAttempts > 0 || user.lockedUntil !== null) {
      user.failedLoginAttempts = 0;
      user.lockedUntil = null;
      await this.repository.save(user);
    }

    // 5. Generar Tokens
    return {
      accessToken: this.jwtService.generateToken({ email: user.email }, 'auth'),
      refreshToken: this.jwtService.generateToken(
        { email: user.email },
        'refresh',
      ),
    };
  }

  async findByEmail(email: string): Promise<UserEntity> {
    return await this.repository.findOne({
      where: { email },
      relations: ['roles', 'roles.permissions'],
    });
  }

  async assignRoles(id: number, assignRoleDto: AssignRoleDto): Promise<UserEntity> {
    const user = await this.findById(id);
    const roles = await Promise.all(
      assignRoleDto.roleIds.map((roleId) => this.rolesService.findById(roleId)),
    );

    if (!user.roles) {
      user.roles = roles;
    } else {
      user.roles = [...user.roles, ...roles];
    }

    return await this.repository.save(user);
  }

  async removeRole(id: number, roleId: number): Promise<{ message: string }> {
    const user = await this.findById(id);
    await this.rolesService.findById(roleId);
    user.roles = user.roles.filter((role) => role.id !== roleId);
    await this.repository.save(user);
    return { message: 'Rol eliminado' };
  }

  async findById(id: number): Promise<UserEntity> {
    const user = await this.repository.findOne({
      where: { id },
      relations: ['roles', 'roles.permissions'],
    });
    if (!user) {
      throw new NotFoundException('El usuario no existe');
    }
    return user;
  }
}