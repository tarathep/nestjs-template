import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { Roles } from './entities/role.entity';
import { RolesQueryDto } from './dtos/roles-query.dto';
import { PaginationProvider } from 'src/common/pagination/providers/pagination.provider';
import { UpsertRoleDto } from './dtos/upsert-role.dto';
import { RoleStatus } from 'src/common/enums/role-status.enum';
import { RolePermissionAssignments } from 'src/role-permission-assignments/entities/role-permission-assignment.entity';
import { Permissions } from 'src/permissions/entities/permission.entity';
import { PermissionAssigned } from './types/permission-assigned.type';

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(
    @InjectRepository(Roles)
    private readonly rolesRepository: Repository<Roles>,
    private readonly paginationProvider: PaginationProvider,
    private readonly dataSource: DataSource,
  ) {}

  async getRoleSummaries(query: RolesQueryDto) {
    // Base domain (with joins used by the SELECT)
    const baseQb = this.rolesRepository
      .createQueryBuilder('r')
      .leftJoin('user_role_assignments', 'ura', 'ura.role_id = r.id');

    // Apply filters ONCE to the domain
    this.applyRoleFilters(baseQb, query);

    // Rows (grouped) — pick only what you want to return
    const rowsQb = baseQb
      .clone()
      .select([
        'r.id AS id',
        'r.role_id AS role_id',
        'r.name AS role_name',
        'COUNT(ura.user_id) AS assigned_users',
        'CONVERT(VARCHAR(19), r.created_at, 120) AS last_created',
        'CONVERT(VARCHAR(19), r.updated_at, 120) AS last_modified',
        "ISNULL(r.status, 'INACTIVE') AS status",
      ])
      .groupBy('r.id, r.role_id, r.name, r.created_at, r.updated_at, r.status');

    // Total over the same filtered domain (no GROUP BY)
    const totalQb = this.rolesRepository.createQueryBuilder('r');
    this.applyRoleFilters(totalQb, query);

    // MSSQL-safe pagination via ROW_NUMBER()
    const { data, pagination } =
      await this.paginationProvider.paginateQuery<RolesQueryDto>(
        rowsQb,
        totalQb,
        query,
        {
          orderBy: 'id ASC',
          selectColumns: [
            'id',
            'role_id',
            'role_name',
            'assigned_users',
            'last_created',
            'last_modified',
            'status',
          ],
          includeRowNumber: true,
        },
      );

    return { data, pagination };
  }

  async findPermissionsAssigned(roleId: number): Promise<PermissionAssigned[]> {
    this.logger.log(`Fetching permissions for role id=${roleId}`);

    // 1) Ensure role exists
    const role = await this.dataSource
      .getRepository(Roles)
      .findOne({ where: { id: roleId } });

    if (!role) {
      this.logger.warn(`Role id=${roleId} not found`);
      throw new NotFoundException({
        detail: 'Role not found',
        errors: [
          {
            field: 'role_id',
            code: 'not_found',
            message: `Role id=${roleId} does not exist`,
          },
        ],
      });
    }
    this.logger.debug(
      `Role found: ${JSON.stringify({ id: role.id, name: role.name })}`,
    );

    // 2) Join role_permission_assignments + permissions
    this.logger.debug(
      `Querying role_permission_assignments for role_id=${roleId}`,
    );
    const rows = await this.dataSource
      .getRepository(RolePermissionAssignments)
      .createQueryBuilder('rpa')
      .innerJoin(Permissions, 'p', 'rpa.permission_id = p.id')
      .select([
        'rpa.id AS permission_assignment_id',
        'rpa.permission_id AS permission_id',
        'p.name AS name',
      ])
      .where('rpa.role_id = :rid', { rid: roleId })
      .orderBy('p.name', 'ASC')
      .getRawMany<PermissionAssigned>();

    this.logger.debug(
      `Found ${rows.length} permission assignment(s) for role id=${roleId}`,
    );

    // 3) Return formatted response
    this.logger.log(
      `Returning permissions for role id=${roleId} (count=${rows.length})`,
    );
    return rows;
  }

  async upsert(dto: UpsertRoleDto): Promise<void> {
    const normalizedName = dto.role_name.trim();
    const requested = Array.from(
      new Set(
        (dto.permissions ?? []).map((s) => String(s).trim()).filter(Boolean),
      ),
    );
    if (!requested.length) {
      this.logger.warn('permissions array is empty');
      throw new BadRequestException('permissions must be a non-empty array');
    }

    await this.dataSource.transaction(async (manager) => {
      const roleRepository = manager.getRepository(Roles);

      let role: Roles | null;
      if (dto.id != null) {
        this.logger.log(`Looking up existing role id=${dto.id}`);
        role = await roleRepository.findOne({ where: { id: dto.id } });
        this.logger.debug(`Found role: ${JSON.stringify(role)}`);
        if (!role) {
          this.logger.error(`Role id=${dto.id} not found`);
          throw new NotFoundException(`Role id=${dto.id} not found`);
        }

        if (normalizedName.toLowerCase() !== role.name.toLowerCase()) {
          const nameTaken = await roleRepository
            .createQueryBuilder('r')
            .where('LOWER(r.name) = LOWER(:name)', { name: normalizedName })
            .andWhere('r.id <> :id', { id: role.id })
            .getExists();
          if (nameTaken) {
            this.logger.warn(
              `Duplicate role name on update: "${normalizedName}"`,
            );
            throw new BadRequestException(
              `role_name "${normalizedName}" already exists`,
            );
          }
        }
      } else {
        const nameTaken = await roleRepository
          .createQueryBuilder('r')
          .where('LOWER(r.name) = LOWER(:name)', { name: normalizedName })
          .getExists();
        if (nameTaken) {
          this.logger.warn(
            `Duplicate role name on create: "${normalizedName}"`,
          );
          throw new BadRequestException(
            `role_name "${normalizedName}" already exists`,
          );
        }
        role = roleRepository.create();
      }

      // CURRENT permission set from join table
      const currentRows = await manager
        .createQueryBuilder()
        .select('rpa.permission_id', 'permission_id')
        .from('role_permission_assignments', 'rpa')
        .where('rpa.role_id = :rid', { rid: role!.id ?? 0 })
        .getRawMany<{ permission_id: string }>();

      const current = new Set(currentRows.map((r) => r.permission_id));
      const requestedSet = new Set(requested);

      // diffs
      const toInsert = requested.filter((pid) => !current.has(pid));
      const toDelete = [...current].filter((pid) => !requestedSet.has(pid));

      // core changes
      const statusChanged = (dto.status as RoleStatus) !== role!.status;
      const nameChanged = normalizedName !== role!.name;

      // CREATE: always proceed (new role)
      // UPDATE: if no core changes and no permission diffs -> bail out
      if (
        dto.id != null &&
        !nameChanged &&
        !statusChanged &&
        toInsert.length === 0 &&
        toDelete.length === 0
      ) {
        this.logger.warn(`No changes detected for role id=${role!.id}`);
        throw new BadRequestException('No changes to apply');
      }

      // Save core (create or update)
      role!.name = normalizedName;
      role!.status = dto.status as RoleStatus;
      role = await roleRepository.save(role!);
      this.logger.log(`Saved role id=${role.id}, roleId=${role.roleId}`);

      // Apply permission diffs only (more efficient than wipe+insert)
      if (toDelete.length) {
        await manager
          .createQueryBuilder()
          .delete()
          .from('role_permission_assignments')
          .where('role_id = :rid', { rid: role.id })
          .andWhere('permission_id IN (:...permIds)', { permIds: toDelete })
          .execute();
        this.logger.debug(
          `Removed ${toDelete.length} ${toDelete.length === 1 ? 'permission' : 'permissions'} from role id=${role.id}`,
        );
      }

      if (toInsert.length) {
        const rows = toInsert.map((pid) => ({
          id: () => 'NEWID()',
          role_id: role!.id,
          permission_id: pid,
          updated_at: () => 'SYSDATETIME()',
          updated_by: null,
        }));
        await manager
          .createQueryBuilder()
          .insert()
          .into('role_permission_assignments', [
            'id',
            'role_id',
            'permission_id',
            'updated_at',
            'updated_by',
          ])
          .values(rows)
          .execute();
        this.logger.debug(
          `Added ${toInsert.length} ${toInsert.length === 1 ? 'permission' : 'permissions'} to role id=${role.id}`,
        );
      }

      this.logger.log(
        `Upsert complete for role id=${role.id} — nameChanged=${nameChanged}, statusChanged=${statusChanged}, add=${toInsert.length}, remove=${toDelete.length}`,
      );
    });
  }

  async deleteRole(roleId: number): Promise<number> {
    this.logger.debug(`Deleting role id=${roleId}`);

    if (!roleId) {
      this.logger.warn(`❌ deleteRole called with invalid roleId: ${roleId}`);
      throw new BadRequestException({
        detail: 'roleId must be provided',
        errors: [
          { field: 'id', code: 'required', message: 'roleId is required' },
        ],
      });
    }

    return this.dataSource.transaction(async (manager) => {
      const rolesRepository = manager.getRepository(Roles);
      const rpaRepository = manager.getRepository(RolePermissionAssignments);

      try {
        const role = await rolesRepository.findOne({ where: { id: roleId } });
        if (!role) {
          this.logger.warn(`❌ Role id=${roleId} not found`);
          throw new NotFoundException({
            detail: 'Role not found',
            errors: [
              {
                field: 'id',
                code: 'not_found',
                message: `Role with id=${roleId} does not exist`,
              },
            ],
          });
        }

        const rpaResult = await rpaRepository.delete({ role_id: roleId });
        const roleResult = await rolesRepository.delete({ id: roleId });

        this.logger.log(
          `✅ Deleted role id=${roleId}. Removed ${rpaResult.affected ?? 0} role_permission_assignments.`,
        );

        return roleResult.affected ?? 0;
      } catch (err: any) {
        this.logger.error(
          `❌ Error deleting role id=${roleId}: ${err.message}`,
        );
        throw new InternalServerErrorException({
          detail: 'Failed to delete role',
          errors: [
            {
              field: 'role',
              code: 'delete_failed',
              message: err.message || 'Unexpected error',
            },
          ],
        });
      }
    });
  }


  async getRolesByRoleIds(roleIds: number[]): Promise<Roles[]> {
    if (!roleIds.length) return [];
    return this.rolesRepository
      .createQueryBuilder('r')
      .where('r.id IN (:...roleIds)', { roleIds })
      .select(['r.id', 'r.name', 'r.status'])
      .getMany();
  }

  private applyRoleFilters(
    qb: SelectQueryBuilder<any>,
    dto: RolesQueryDto,
  ): void {
    if (dto.id !== undefined) {
      qb.andWhere('r.id = :id', { id: dto.id });
    }
    if (dto.role_id) {
      qb.andWhere('r.role_id = :role_id', { role_id: dto.role_id });
    }
    if (dto.role_name) {
      qb.andWhere('r.name LIKE :role_name', {
        role_name: `%${dto.role_name}%`,
      });
    }

    if (dto.from) {
      qb.andWhere('r.created_at >= :from', {
        from: dto.from,
      });
    }
    if (dto.to) {
      qb.andWhere('r.created_at <= :to', {
        to: dto.to,
      });
    }

    if (dto.status) {
      qb.andWhere("ISNULL(r.status, 'INACTIVE') = :status", {
        status: dto.status,
      });
    }
  }
}
