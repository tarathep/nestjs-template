import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Roles } from '../roles/entities/role.entity';
import { UserRoleAssignments } from './entities/user-role-assignments.entity';
import { UserRoleAssignmentsService } from './user-role-assignments.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Roles, UserRoleAssignments]),
  ],
  providers: [UserRoleAssignmentsService],
  exports: [UserRoleAssignmentsService],
})
export class UserRoleAssignmentsModule {}
