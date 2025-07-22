// Entidad Role: representa un rol que agrupa permisos
import { BaseEntity, Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { UserEntity } from "./user.entity";
import { PermissionEntity } from "./permission.entity";

@Entity('roles')
export class RoleEntity extends BaseEntity {
    // ID autoincremental
    @PrimaryGeneratedColumn()
    id: number;

    // Nombre único del rol (ej: 'admin', 'delivery')
    @Column({ unique: true })
    name: string;

    // Relación muchos a muchos con usuarios
    @ManyToMany(() => UserEntity, user => user.roles)
    users: UserEntity[];

    // Relación muchos a muchos con permisos
    @ManyToMany(() => PermissionEntity, permission => permission.roles)
    @JoinTable() // Indica la tabla intermedia
    permissions: PermissionEntity[];
}