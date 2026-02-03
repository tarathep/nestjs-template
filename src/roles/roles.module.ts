import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Roles } from './entities/role.entity';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { PaginationModule } from 'src/common/pagination/pagination.module';
import { RolePermissionAssignments } from 'src/role-permission-assignments/entities/role-permission-assignment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Roles, RolePermissionAssignments]),
    PaginationModule,
  ],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}
