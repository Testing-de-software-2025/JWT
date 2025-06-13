import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, BaseEntity} from 'typeorm';
import { RoleEntity } from './role.entity';
import { UserEntity } from './user.entity';

@Entity()
export class PermissionEntity extends BaseEntity	{
 
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToMany(() => RoleEntity, role => role.permissions)
  roles: RoleEntity[];

  @ManyToMany(() => UserEntity, user => user.permissions)
  users: UserEntity[];
}
