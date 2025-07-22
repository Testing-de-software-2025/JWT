// Entidad Permission: representa un permiso individual en el sistema
import { BaseEntity, Column, Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { RoleEntity } from "./role.entity";

@Entity('permissions')
export class PermissionEntity extends BaseEntity {
    // ID autoincremental
    @PrimaryGeneratedColumn()
    id: number;

    // Nombre único del permiso (ej: 'delivery_create')
    @Column({ unique: true })
    name: string;

    // Relación muchos a muchos con roles
    @ManyToMany(() => RoleEntity, role => role.permissions)
    roles: RoleEntity[];
}