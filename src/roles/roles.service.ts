import { Injectable, HttpException, NotFoundException} from '@nestjs/common';
import { RoleEntity } from 'src/entities/role.entity'
import { Repository, DeepPartial } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PermissionsService } from 'src/permissions/permissions.service';


@Injectable()
export class RolesService {
    repository = RoleEntity; 
    constructor(
      private permissionsService: PermissionsService
    ) {}

    async findRoles() {
        try {
            return this.repository.find();
        } catch (error) {   
            throw new HttpException('Find all Roles error', 500)
        }
    }
    
    async findRoleById(id: number): Promise<RoleEntity> {
        const role = await this.repository.findOne({where:{id}});
        if (!role) {
            throw new NotFoundException(`Role with id ${id} not found`);
        }
        return role;
    }

    async assignPermissionToRole(idRole: number, body: { permissionId: number }) {
        const role = await this.repository.findOne({
            where: { id: idRole },
            relations: ['permissions'],
          });

        if (!role) {
            throw new NotFoundException(`Role with id ${idRole} not found`);
        }

        const permission = await this.permissionsService.findPermissionById(body.permissionId );

        if (!permission) {
            throw new NotFoundException(`Permission with ID ${body.permissionId} not found`);
          }
        if (!role.permissions) {
            role.permissions = [];
        }

        role.permissions.push(permission); //le agrega el permiso a users
        await role.save();
        
        return role;
    }

    async updateRole(id: number, role: DeepPartial<RoleEntity>) {
        const query = this.repository.createQueryBuilder('role').where('role.id = :id', { id });
        const roleActual = await query.getOne();
        this.repository.merge(roleActual, role);
        if (!roleActual) {
            throw new NotFoundException(`Role with id ${id} not found`);
        }
        return await this.repository.save(roleActual);
    }

    async deleteRole(id: number){
        const roleRemove = await this.repository.findOneBy({
            id: id
        })
        return await this.repository.remove(roleRemove);
    }

    createRoles(role: DeepPartial<RoleEntity>) {
        try {
            return this.repository.save(role);
        } catch (error) {
            throw new HttpException('Create Role error', 500)
        }
    }

}
