import {
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ArrayNotEmpty,
  ArrayUnique,
} from 'class-validator';
import { Role } from 'src/common/enums/role.enum';

export enum UpsertUserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export class UpsertUserDto {
  @IsOptional()
  @IsString()
  user_id?: string;

  @IsOptional()
  @IsString()
  employee_id?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(UpsertUserStatus, { message: 'status must be ACTIVE or INACTIVE' })
  status?: UpsertUserStatus;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty({ message: 'roles must be a non-empty array' })
  @ArrayUnique({ message: 'roles must be unique' })
  roles?: Role[];
}
