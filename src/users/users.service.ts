import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from './entities/user.entity';
import { Roles } from 'src/roles/entities/role.entity';
import { UserRoleAssignments } from 'src/user-role-assignments/entities/user-role-assignments.entity';
import { Role } from 'src/common/enums/role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(Roles) private readonly rolesRepo: Repository<Roles>,
    @InjectRepository(UserRoleAssignments)
    private readonly uraRepo: Repository<UserRoleAssignments>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return await this.usersRepo.findOne({ where: { id } });
  }

  async findByEmail(email: string) {
    return this.usersRepo.findOne({
      where: { email: email.toLowerCase() },
      relations: [
        'userRoleAssignments',
        'userRoleAssignments.role',
        'userRoleAssignments.role.rolePermissionAssignments',
        'userRoleAssignments.role.rolePermissionAssignments.permission',
      ],
    });
  }

  async findByIdWithRoles(id: string) {
    return this.usersRepo.findOne({
      where: { id },
      relations: [
        'userRoleAssignments',
        'userRoleAssignments.role',
        'userRoleAssignments.role.rolePermissionAssignments',
        'userRoleAssignments.role.rolePermissionAssignments.permission',
      ],
    });
  }

  async createUser(params: {
    email: string;
    password: string;
    name?: string;
    roles?: Role[];
  }): Promise<User> {
    const email = params.email.toLowerCase();

    const exists = await this.usersRepo.findOne({ where: { email } });
    if (exists) throw new BadRequestException('Email already exists');

    const passwordHash = await bcrypt.hash(params.password, 10);

    const user = this.usersRepo.create({
      email,
      name: params.name ?? null,
      passwordHash,
      loginCount: 0,
      status: 'ACTIVE' as any,
    });
    const savedUser = await this.usersRepo.save(user);
    const wanted = params.roles?.length ? params.roles : [Role.User];

    // IMPORTANT:
    // This assumes your Roles table has `name` like 'Administrator' etc.
    // You need a stable mapping from enum Role -> row in Roles table.
    // Easiest: store Role enum in Roles.name (admin/user) or add Roles.code column.
    const roleRows = await this.rolesRepo.find({
      where: { name: In(wanted) as any }, // if Roles.name stores 'admin'/'user'
    });

    if (!roleRows.length) {
      throw new BadRequestException('Roles not found in roles table');
    }

    // ✅ insert assignments
    const assignments = roleRows.map((roleRow) =>
      this.uraRepo.create({
        user_id: savedUser.id,
        role_id: roleRow.id,
        status: 'ACTIVE',
      }),
    );

    await this.uraRepo.save(assignments);

    // return user with roles relation loaded
    return (await this.findByIdWithRoles(savedUser.id)) as User;
  }

  async setHashedRefreshToken(
    userId: string,
    hashedRefreshToken: string | null,
  ): Promise<void> {
    await this.usersRepo.update({ id: userId }, { hashedRefreshToken });
  }

  safeUser(user: User) {
    const { passwordHash, hashedRefreshToken, ...safe } = user as any;
    return safe;
  }
}
