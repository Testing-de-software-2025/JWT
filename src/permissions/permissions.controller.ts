// Controlador para la gestión de permisos
import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { PermissionsService } from "./permissions.service";
import { CreatePermissionDto } from "../interfaces/createPermission.dto";
import { PermissionEntity } from "../entities/permission.entity";
import { AuthGuard } from "../middlewares/auth.middleware";
import { Permissions } from "../middlewares/decorators/permissions.decorator";

@Controller('permissions')
export class PermissionsController {
    constructor(private readonly permissionsService: PermissionsService) {}

    // Crea un nuevo permiso (requiere permiso 'permission_create')
    @UseGuards(AuthGuard)
    @Permissions(['permission_create'])
    @Post()
    create(@Body() createPermissionDto: CreatePermissionDto): Promise<PermissionEntity> {
        return this.permissionsService.create(createPermissionDto);
    }

    // Obtiene todos los permisos (requiere permiso 'permission_reader')
    @UseGuards(AuthGuard)
    @Permissions(['permission_reader'])
    @Get('all')
    findAll(): Promise<PermissionEntity[]> {
        return this.permissionsService.findAll();
    }

    // Actualiza un permiso por ID (requiere permiso 'permission_editor')
    @UseGuards(AuthGuard)
    @Permissions(['permission_editor'])
    @Put(':id')
    update(@Param('id') id: number, @Body() createPermissionDto: CreatePermissionDto): Promise<PermissionEntity> {
        return this.permissionsService.update(id, createPermissionDto);
    }

    // Elimina un permiso por ID (requiere permiso 'permission_delete')
    @UseGuards(AuthGuard)
    @Permissions(['permission_delete'])
    @Delete(':id')
    delete(@Param('id') id: number): Promise<{ message: string }> {
        return this.permissionsService.delete(id);
    }

    // Obtiene un permiso por ID (requiere permiso 'permission_reader')
    @UseGuards(AuthGuard)
    @Permissions(['permission_reader'])
    @Get(':id')
    findById(@Param('id') id: number): Promise<PermissionEntity> {
        return this.permissionsService.findById(id);
    }
}