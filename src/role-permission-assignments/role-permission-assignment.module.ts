import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Roles } from '../roles/entities/role.entity';
import { Permissions } from '../permissions/entities/permission.entity';
import { RolePermissionAssignmentService } from './role-permission-assignment.service'
import { RolePermissionAssignments } from './entities/role-permission-assignment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Roles, Permissions, RolePermissionAssignments]),
  ],
  providers: [RolePermissionAssignmentService],
  exports: [RolePermissionAssignmentService],
})
export class RolePermissionAssignmentModule {}
