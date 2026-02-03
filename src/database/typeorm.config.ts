import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  TypeOrmModuleAsyncOptions,
  TypeOrmModuleOptions,
} from '@nestjs/typeorm';
import { Roles } from 'src/roles/entities/role.entity';
import { Permissions } from 'src/permissions/entities/permission.entity';
import { RolePermissionAssignments } from 'src/role-permission-assignments/entities/role-permission-assignment.entity';
import { UserRoleAssignments } from 'src/user-role-assignments/entities/user-role-assignments.entity';
import { User } from 'src/users/entities/user.entity';
import { DbType } from './types/db.type';

function normalizeDbType(type: string): DbType {
  const t = (type || '').toLowerCase();
  if (
    t === 'mariadb' ||
    t === 'mysql' ||
    t === 'postgres' ||
    t === 'mssql' ||
    t === 'sqlite'
  )
    return t;
  return 'mariadb';
}

export const typeOrmConfigAsync: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (config: ConfigService): Promise<TypeOrmModuleOptions> => {
    const db = config.get<any>('db');
    const type = normalizeDbType(db.type);

    const common: Partial<TypeOrmModuleOptions> = {
      autoLoadEntities: true,
      synchronize: !!db.synchronize,
      logging: !!db.logging,
    };

    if (type === 'sqlite') {
      return {
        ...common,
        type: 'sqlite',
        database: db.name || 'db.sqlite',
      } as TypeOrmModuleOptions;
    }

    return {
      ...common,
      type: type as any,
      host: db.host,
      port: Number(db.port),
      username: db.username,
      password: db.password,
      database: db.name,
      entities: [
        User,
        Roles,
        Permissions,
        UserRoleAssignments,
        RolePermissionAssignments,
      ],
    } as TypeOrmModuleOptions;
  },
};
