import {
  IsString,
  IsOptional,
  IsIn,
  IsNotEmpty,
} from 'class-validator';

export class RolesAssignedQueryDto {
  @IsString()
  @IsNotEmpty()
  user_id!: string;

  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE'], {
    message: 'status must be ACTIVE or INACTIVE',
  })
  status?: 'ACTIVE' | 'INACTIVE';
}
