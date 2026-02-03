import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesQueryDto } from './dtos/roles-query.dto';
import { UpsertRoleDto } from './dtos/upsert-role.dto';
import { DeleteRoleDto } from './dtos/delete-role.dto';
import { PermissionsAssignedQueryDto } from './dtos/permission-assigned-query.dto';

@Controller('roles')
export class RolesController {
  private readonly logger = new Logger(RolesController.name);
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  getAllRoles(@Query() query: RolesQueryDto) {
    this.logger.log(`RolesQueryDto: ${JSON.stringify(query)}`);
    return this.rolesService.getRoleSummaries(query);
  }

  @Get('permissions-assigned')
  @HttpCode(HttpStatus.OK)
  async getPermissionsAssigned(@Query() dto: PermissionsAssignedQueryDto) {
    this.logger.debug(
      `Fetching permissions-assigned with role_id: ${dto.role_id}`,
    );
    return this.rolesService.findPermissionsAssigned(dto.role_id);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async upsertRole(@Body() body: UpsertRoleDto) {
    this.logger.debug(`Upsert role request: ${JSON.stringify(body)}`);
    return await this.rolesService.upsert(body);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  async delete(@Body() dto: DeleteRoleDto) {
    this.logger.debug(`Delete role request: ${JSON.stringify(dto)}`);
    try {
      await this.rolesService.deleteRole(dto.id);
      this.logger.log(`✅ Role deleted: id=${dto.id}`);
      return;
    } catch (err: any) {
      this.logger.error(
        `❌ Failed to delete role id=${dto.id}: ${err.message}`,
      );
      throw err;
    }
  }
}
