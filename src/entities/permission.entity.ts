import {BaseEntity, Column, Entity, ManyToMany, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {RoleEntity} from "./role.entity";

@Entity('permissions')
export class PermissionEntity extends BaseEntity{
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    code: string;

    @ManyToMany(() => RoleEntity, role => role.permissions )
    roles: RoleEntity[];
}