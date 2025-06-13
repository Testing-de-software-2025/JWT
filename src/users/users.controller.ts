import { Body, Controller, Get, Param, Post, Req,Put, Delete, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { LoginDTO } from '../interfaces/login.dto';
import { RegisterDTO } from '../interfaces/register.dto';
import { Request } from 'express';
import { UserEntity } from 'src/entities/user.entity';
import { AuthGuard } from 'src/middlewares/auth.middleware';
import { DeepPartial } from 'typeorm';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post(':id/permissions')
    async assignPermissionToUser(@Param('id') idUser: number, @Body() body: { permissionId: number }): Promise<UserEntity> {
      return await this.usersService.assignPermissionToUser(idUser, body);
    }

  @Post()
    async createUsers(@Body() bodyCreateUsers: DeepPartial<UserEntity>): Promise<UserEntity> {
        return await this.usersService.createUsers(bodyCreateUsers);
    }

  @Get()
    async findUsers(): Promise<UserEntity[]>{
        return await this.usersService.findUsers();
    }
    

  @Put(':id')
    async updateUserById(@Param('id') id:number , @Body() bodyUpdateUsers: DeepPartial<UserEntity>): Promise<UserEntity> {
        return await this.usersService.updateUserById(id, bodyUpdateUsers);
    }

  @Delete(':id')
    async deleteUserById(@Param('id') id:number): Promise <UserEntity> {
        return await this.usersService.deleteUserById(id);
    }

  @UseGuards(AuthGuard) //si entra devuelve true, significa que tiene token,(no se si esta bien esto)
  @Get('validateToken')
    validateToken() {
      return true;
    }


  @Post('login')
    login(@Body() body: LoginDTO) {
      return this.usersService.login(body);
    }



  @Post('register')
    register(@Body() body: RegisterDTO) {
      return this.usersService.register(body);
    }

  @UseGuards(AuthGuard)
  @Get('can-do/:permission') // Verifica si el usuario autenticado tiene el permiso especificado
    canDo(@Req() request: Request & { user: UserEntity}, @Param('permission') permission: string) {
      return this.usersService.canDo(request.user, permission);
    }

  @Get('refresh-token')
    refreshToken(@Req() request: Request) {
      return this.usersService.refreshToken(
        request.headers['refresh-token'] as string,
      );
    }

  @Post(':id/roles')  
    async assignRoleToUser(@Param('id') idUser: number, @Body() body: { roleId: number }): Promise<UserEntity> {
      return await this.usersService.assignRoleToUser(idUser, body);
    }
}

//13 - Gracias Fede