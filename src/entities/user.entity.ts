import { UserI } from '../interfaces/user.interface';
import {BaseEntity, Column, Entity, Index, JoinTable, ManyToMany, PrimaryGeneratedColumn} from 'typeorm';
import {RoleEntity} from "./role.entity";
import {PermissionEntity} from "./permission.entity";

@Entity('users')
export class UserEntity extends BaseEntity implements UserI {
  @PrimaryGeneratedColumn()
  id: number;
  @Index({unique:true})
  @Column()
  email: string;
  @Column()
  password: string;

  @ManyToMany(() => RoleEntity, role => role.users)
  @JoinTable()
    roles: RoleEntity[];

  get permissionCodes(): string[] {
    return this.roles?.flatMap(role => role.permissions.map(permission => permission.code)) || [];
  }
}