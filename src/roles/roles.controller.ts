import {Body, Controller, Delete, Get, Param, Post, Put, UseGuards} from '@nestjs/common';
import {RolesService} from "./roles.service";
import {CreateRoleDto} from "../interfaces/createRole.dto";
import {RoleEntity} from "../entities/role.entity";
import {AuthGuard} from "../middlewares/auth.middleware";
import {AssignPermissionsDto} from "../interfaces/assignPermissions.dto";
import {Permissions} from "../middlewares/decorators/permissions.decorator";

@Controller('roles')
export class RolesController {
    constructor(private readonly rolesService: RolesService) {}

    @UseGuards(AuthGuard)
    @Permissions(['create_role'])
    @Post()
    create(@Body() createRoleDto: CreateRoleDto): Promise<RoleEntity> {
        return this.rolesService.create(createRoleDto);
    }

    @UseGuards(AuthGuard)
    @Permissions(['reader_role'])
    @Get('all')
    findAll(): Promise<RoleEntity[]> {
        return this.rolesService.findAll();
    }

    @UseGuards(AuthGuard)
    @Permissions(['reader_role'])
    @Get(':id')
    findById(@Param('id') id: number): Promise<RoleEntity> {
        return this.rolesService.findById(id);
    }

    @UseGuards(AuthGuard)
    @Permissions(['role_editor'])
    @Put(':id')
    update(@Param('id') id: number, @Body() createRoleDto: CreateRoleDto): Promise<RoleEntity> {
        return this.rolesService.update(id, createRoleDto);
    }

    @UseGuards(AuthGuard)
    @Permissions(['role_delete'])
    @Delete(':id')
    delete(@Param('id') id: number): Promise<{ message: string }> {
        return this.rolesService.delete(id);
    }

    @Post(':id/assign-permissions')
    @Permissions(['permission_role_assignment'])
    assignPermissions(@Param('id') id: number, @Body() assignPermissionDto: AssignPermissionsDto ): Promise<RoleEntity> {
        return this.rolesService.assignPermissions(id, assignPermissionDto);
    }

    @Delete(':id/remove-permission/:permissionId')
    @Permissions(['permission_role_assignment'])
    removePermission(@Param('id') id: number, @Param('permissionId') permissionId: number): Promise<{message: string}> {
        return this.rolesService.removePermission(id, permissionId);
    }

}