import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class PermissionsQueryDto {
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  permission_id?: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  permission_name?: string;
}
