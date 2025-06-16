import {
  Body,
  Controller, Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { LoginDTO } from '../interfaces/login.dto';
import { RegisterDTO } from '../interfaces/register.dto';
import { Request } from 'express';
import { AuthGuard } from '../middlewares/auth.middleware';
import { RequestWithUser } from 'src/interfaces/request-user';
import {AssignRoleDto} from "../interfaces/assignRole.dto";
import {UserEntity} from "../entities/user.entity";
import {Permissions} from "../middlewares/decorators/permissions.decorator";

@Controller('')
export class UsersController {
  constructor(private service: UsersService) {}

  @UseGuards(AuthGuard)
  @Get('me')
  me(@Req() req: RequestWithUser) {
    return {
      email: req.user.email,
    };
  }

  @Post('login')
  login(@Body() body: LoginDTO) {
    return this.service.login(body);
  }

  @Post('register')
  register(@Body() body: RegisterDTO) {
    return this.service.register(body);
  }

  @UseGuards(AuthGuard)
  @Get('can-do/:permission')
  canDo(
    @Req() request: RequestWithUser,
    @Param('permission') permission: string,
  ) {
    return this.service.canDo(request.user, permission);
  }

  @Get('refresh-token')
  refreshToken(@Req() request: Request) {
    return this.service.refreshToken(
      request.headers['refresh-token'] as string,
    );
  }

  @UseGuards(AuthGuard)
  @Permissions(['user_role_assignment'])
  @Post(':id/assign-roles')
  assignRole(@Param('id') id: number, @Body() assignRoleDto: AssignRoleDto) {
    return this.service.assignRoles(id, assignRoleDto);
  }

  @UseGuards(AuthGuard)
  @Permissions(['user_role_assignment'])
  @Delete(':id/remove-role/:roleId')
  removeRole(@Param('id') id: number, @Param('roleId') roleId: number) {
    return this.service.removeRole(id, roleId);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  @Permissions(['user_reader'])
  findById(@Param('id') id:number): Promise<UserEntity> {
    return this.service.findById(id);
  }
}