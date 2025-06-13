import { PermissionEntity } from 'src/entities/permission.entity';
import { PermissionsController } from './permissions.controller';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial} from 'typeorm';
import { HttpException } from '@nestjs/common/exceptions/http.exception';
@Injectable()
export class PermissionsService {
    constructor(@InjectRepository(PermissionEntity)
        private repository: Repository<PermissionEntity>,
    ){}

    async createPermissions(permission: DeepPartial<PermissionEntity>): Promise<PermissionEntity> {
        try {
            return await this.repository.save(permission);
        } catch (error) {
            throw new HttpException('Create product error', 500)
        }
    }
    
    async findPermissions(){
        try {            
            return await this.repository.find();
        } catch (error) {
            throw new HttpException('Find all products error', 500)
        } 
    }

    async findPermissionById(id: number): Promise<PermissionEntity> {
        const permission = await this.repository.findOne({where:{id}});
        if (!permission) {
            throw new NotFoundException(`Permission with id ${id} not found`);
        }
        return permission;
    }

    async updatePermissionById(id: number, permission: DeepPartial<PermissionEntity>): Promise<PermissionEntity> {
        const query = this.repository.createQueryBuilder('permission')
            .where('permission.id = :id', { id });
        const permissionActual = await query.getOne();
        this.repository.merge(permissionActual, permission);
        if (!permissionActual) {
            throw new NotFoundException(`Permission with id ${id} not found`);
        }
        return await this.repository.save(permissionActual);
    }
    async deletePermissionById(id: number): Promise <PermissionEntity> {
        const permissionRemove = await this.repository.findOneBy({
            id: id
        })
        return await this.repository.remove(permissionRemove);
    }
}