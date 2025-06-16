import {Injectable, NotFoundException} from '@nestjs/common';
import {Repository} from "typeorm";
import {PermissionEntity} from "../entities/permission.entity";
import {InjectRepository} from "@nestjs/typeorm";
import {CreatePermissionDto} from "../interfaces/createPermission.dto";

@Injectable()
export class PermissionsService {
    private permissionRepository: Repository<PermissionEntity>;

    constructor(
        @InjectRepository(PermissionEntity)
        permissionRepository: Repository<PermissionEntity>,
    ) {
        this.permissionRepository = permissionRepository;
    }

    async create (createPermissionDto: CreatePermissionDto): Promise<PermissionEntity> {
        const permission = this.permissionRepository.create(createPermissionDto);
        return this.permissionRepository.save(permission);
    }

    async findAll(): Promise<PermissionEntity[]> {
        return this.permissionRepository.find();
    }

    async findById(id: number): Promise<PermissionEntity> {
        const permission = await this.permissionRepository.findOne({where: {id}});

        if(!permission) {
            throw new NotFoundException('El permiso no existe');
        }

        return permission;
    }

    async update(id: number, createPermissionDto: CreatePermissionDto): Promise<PermissionEntity> {
        const permission = await this.findById(id);
        this.permissionRepository.merge(permission, createPermissionDto);
        return this.permissionRepository.save(permission);
    }

    async delete(id: number): Promise<{ message: string }> {
        const permission = await this.findById(id);
        await this.permissionRepository.remove(permission);
        return { message: 'Permiso eliminado' };
    }
}