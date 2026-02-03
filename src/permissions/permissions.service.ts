import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Permissions } from 'src/permissions/entities/permission.entity';
import { PermissionsQueryDto } from './dtos/permissions-query.dto';

@Injectable()
export class PermissionsService {
  private readonly logger = new Logger(PermissionsService.name);
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async findAll(query: PermissionsQueryDto) {
    this.logger.log(
      `Fetching permissions with filters: ${JSON.stringify(query)}`,
    );

    const qb = this.dataSource
      .createQueryBuilder()
      .select([
        'p.id AS permission_id',
        'p.name AS permission_name',
        'p.description AS description',
      ])
      .from('permissions', 'p')
      .orderBy('p.name', 'ASC');

    if (query.permission_id) {
      qb.andWhere('p.id = :pid', { pid: query.permission_id });
    }
    if (query.permission_name) {
      qb.andWhere('p.name LIKE :pname', {
        pname: `%${query.permission_name}%`,
      });
    }

    const rows = await qb.getRawMany<{
      permission_id: string;
      permission_name: string;
      description: string;
    }>();

    return {
      status: 200,
      message: 'Successful',
      data: rows,
    };
  }

  async getPermissionsByUserId(userId: string): Promise<Permissions[]> {
    if (!userId) {
      throw new Error('User ID is required to fetch permissions');
    }
    const dataSource = this.dataSource
      .getRepository(Permissions)
      .createQueryBuilder('p')
      .innerJoin(
        'role_permission_assignments',
        'rpa',
        'rpa.permission_id = p.id',
      )
      .innerJoin('roles', 'r', 'r.id = rpa.role_id')
      .innerJoin('user_role_assignments', 'ura', 'ura.role_id = r.id')
      .innerJoin('users', 'u', 'u.id = ura.user_id')
      .where('u.id = :userId', { userId })
      .getMany();

    this.logger.debug(
      `Fetching permissions for user ID ${userId}: ${JSON.stringify(dataSource)}`,
    );
    if (!dataSource) {
      this.logger.warn(`No permissions found for user ID ${userId}`);
    }
    return dataSource;
  }
}
