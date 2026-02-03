import { IsIn, IsInt, IsOptional, Matches, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { DateTimeISO8601 } from 'src/common/validators/datetime-format';

export class UsersQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  employee_id?: string;

  @IsOptional()
  name?: string;

  @IsOptional()
  email?: string;

  @IsOptional()
  @Matches(DateTimeISO8601, { message: 'from must be YYYY-MM-DDTHH:mm:ssZ' })
  from?: string;

  @IsOptional()
  @Matches(DateTimeISO8601, { message: 'from must be YYYY-MM-DDTHH:mm:ssZ' })
  to?: string;

  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status?: 'ACTIVE' | 'INACTIVE';
}
