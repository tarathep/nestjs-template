import {
  Controller,
  Get,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOkResponse, ApiQuery } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { PermissionsQueryDto } from './dtos/permissions-query.dto';
import { PermissionsResponseDto } from './dtos/permissions-response.dto';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiQuery({ name: 'permission_id', required: false, type: String })
  @ApiQuery({ name: 'permission_name', required: false, type: String })
  @ApiOkResponse({ type: [PermissionsResponseDto] })
  async getPermissions(@Query() query: PermissionsQueryDto) {
    return this.permissionsService.findAll(query);
  }
}
