// Exporta todas las entidades para su uso en TypeORM
import { UserEntity } from './user.entity';
import { RoleEntity } from './role.entity';
import { PermissionEntity } from './permission.entity';

// Array de entidades para registrar en el módulo principal
export const entities = [UserEntity, RoleEntity, PermissionEntity];