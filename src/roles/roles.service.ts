import {Injectable, NotFoundException} from '@nestjs/common';
import {Repository} from "typeorm";
import {RoleEntity} from "../entities/role.entity";
import {InjectRepository} from "@nestjs/typeorm";
import {CreateRoleDto} from "../interfaces/createRole.dto";
import {PermissionsService} from "../permissions/permissions.service";
import {AssignPermissionsDto} from "../interfaces/assignPermissions.dto";

@Injectable()
export class RolesService {
    private roleRepository: Repository<RoleEntity>

    constructor(
        private readonly permissionsService: PermissionsService,
        @InjectRepository(RoleEntity)
        roleRepository: Repository<RoleEntity>,
    ) {
        this.roleRepository = roleRepository;
    }

    async create(creatRoleDto: CreateRoleDto): Promise<RoleEntity> {
        const role = this.roleRepository.create(creatRoleDto);
        return this.roleRepository.save(role);
    }

    async findAll(): Promise<RoleEntity[]> {
        return this.roleRepository.find({relations: ['permissions']});
    }

    async findById(id: number): Promise<RoleEntity> {
        const role = await this.roleRepository.findOne({where: {id}, relations: ['permissions']});

        if(!role) {
            throw new NotFoundException('El rol no existe');
        }
        return role;
    }

    async update(id: number, createRoleDto: CreateRoleDto): Promise<RoleEntity> {
        const role = await this.findById(id);
        this.roleRepository.merge(role, createRoleDto);
        return this.roleRepository.save(role);
    }

    async delete(id: number): Promise<{ message: string }> {
        const role = await this.findById(id);
        await this.roleRepository.remove(role);
        return { message: 'Rol eliminado' };
    }

    async assignPermissions(id: number, assignPermissionsDto: AssignPermissionsDto): Promise<RoleEntity> {
        const role = await this.findById(id);

        const roles = await Promise.all(assignPermissionsDto.permissionIds.map((permissionId)=> this.permissionsService.findById(permissionId)));

        if(!role.permissions) {
            role.permissions = roles;
        } else {
            role.permissions= [...role.permissions, ...roles];
        }
        return this.roleRepository.save(role);
    }

    async removePermission(id:number, permissionId:number): Promise<{message: string}> {
        const role = await this.findById(id);
        await this.permissionsService.findById(permissionId);
        role.permissions = role.permissions.filter(permission => permission.id !== permissionId);
        await this.roleRepository.save(role);
        return {message: 'Permiso eliminado'};
    }
}