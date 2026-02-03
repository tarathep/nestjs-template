import { IsInt, IsNotEmpty, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PermissionsAssignedQueryDto {
  @IsNotEmpty({ message: 'role_id is required' })
  @Type(() => Number)
  @IsInt({ message: 'role_id must be an integer' })
  @Min(1, { message: 'role_id must be a positive integer' })
  role_id!: number;
}
