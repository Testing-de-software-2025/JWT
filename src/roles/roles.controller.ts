import { Body, Param, Post, Get, Put, Delete, Controller  } from '@nestjs/common';
import { RolesService } from './roles.service';
import { DeepPartial } from 'typeorm';
import { RoleEntity } from 'src/entities/role.entity';

@Controller('roles')
export default class RolesController {
    constructor(private rolesService: RolesService) {}
    
    @Post(':id/permissions')
    async assignPermissionToRole(@Param('id') idRole: number, @Body() body: { permissionId: number }): Promise<RoleEntity> {
        return await this.rolesService.assignPermissionToRole(idRole, body);
    }

    @Get()
    async findRoles() {
        return await this.rolesService.findRoles();
    }

    @Post()
    async createRoles(@Body() bodyCreateRoles: DeepPartial<RoleEntity>): Promise<RoleEntity> {
        return await this.rolesService.createRoles(bodyCreateRoles);
    }

    @Delete(':id')
    async deleteRole(@Param('id') id: number): Promise<RoleEntity> {
        return await this.rolesService.deleteRole(id);
    }
    
    @Put(':id')
    async updateRole(@Param('id') id: number, @Body() bodyUpdateRole: DeepPartial<RoleEntity>): Promise<RoleEntity>{
        return await this.rolesService.updateRole(id, bodyUpdateRole);
    }

    
}
