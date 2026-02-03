import {
  IsInt,
  IsOptional,
  IsString,
  IsEnum,
  IsArray,
  ArrayNotEmpty,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { RoleStatus } from 'src/common/enums/role-status.enum';

export class UpsertRoleDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Role ID (only required when updating an existing role)',
  })
  @IsOptional()
  @IsInt()
  id?: number;

  @ApiProperty({
    example: 'Administrator',
    description: 'Role name (max length: 200)',
  })
  @IsString()
  @MaxLength(200)
  role_name!: string;

  @ApiProperty({
    example: RoleStatus.ACTIVE,
    enum: RoleStatus,
    description: 'Role status (ACTIVE or INACTIVE)',
  })
  @IsEnum(RoleStatus)
  status!: RoleStatus;

  @ApiProperty({
    type: [String],
    example: ['PREAD-USER', 'PPOST-USER'],
    description: 'List of permission IDs assigned to this role',
  })
  @IsArray()
  @ArrayNotEmpty()
  permissions!: string[];
}
