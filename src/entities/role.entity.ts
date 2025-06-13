import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, BaseEntity } from 'typeorm';
import { PermissionEntity } from './permission.entity';
import { UserEntity } from './user.entity';

@Entity('roles')
export class RoleEntity extends BaseEntity{
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;
  
  @Column({ nullable: true })
  code: string;

  @Column({ nullable: true })
  description: string;

  @ManyToMany(() => PermissionEntity, permission => permission.roles)
  
  @JoinTable()
  permissions: PermissionEntity[];

  @ManyToMany(() => UserEntity, user => user.roles)

  @JoinTable()
  users: UserEntity[];
}