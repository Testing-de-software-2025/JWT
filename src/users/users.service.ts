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
import * as dayjs from 'dayjs';
import { AssignRoleDto } from "../interfaces/assignRole.dto";
import { RolesService } from "../roles/roles.service";
import { RequestWithUser } from "../interfaces/request-user";

@Injectable()
export class UsersService {
  // Repositorio de usuarios
  repository = UserEntity;
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
    const compareResult = compareSync(body.password, user.password);
    if (!compareResult) {
      throw new UnauthorizedException();
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
    const user = await this.repository.findOne({where: {id}, relations: ["roles","roles.permissions"], select: ["id", "email", "roles"]});
    if(!user) {
      throw new NotFoundException('El usuario no existe');
    }
    return user;
  }

}