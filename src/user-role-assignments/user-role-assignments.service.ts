import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRoleAssignments } from './entities/user-role-assignments.entity';

export enum Status {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

@Injectable()
export class UserRoleAssignmentsService {
  constructor(
    @InjectRepository(UserRoleAssignments)
    private readonly uraRepo: Repository<UserRoleAssignments>,
  ) {}

  async getRolesByUserId(userId: string): Promise<UserRoleAssignments[]> {
    const rows = await this.uraRepo.find({
      where: { user_id: userId, status: Status.ACTIVE },
    });
    return rows;
  }
}
