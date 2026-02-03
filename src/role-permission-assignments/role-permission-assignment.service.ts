import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { RolePermissionAssignments } from '../role-permission-assignments/entities/role-permission-assignment.entity';

export enum Status {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

@Injectable()
export class RolePermissionAssignmentService {
  constructor(
    @InjectRepository(RolePermissionAssignments)
    private readonly rpaRepo: Repository<RolePermissionAssignments>,
  ) {}

  //   async getPermissionsByRoleId(
  //     roleId: number,
  //   ): Promise<RolePermissionAssignments[]> {
  //     const rows = await this.rpaRepo.find({
  //       where: { role_id: roleId },
  //     });
  //     return rows;
  //   }
  async getPermissionsByRoleIds(
    roleIds: number[],
  ): Promise<RolePermissionAssignments[]> {
    if (!roleIds.length) return [];
    return this.rpaRepo.find({
      where: { role_id: In(roleIds) },
    });
  }
}
