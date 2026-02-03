import {
  IsInt,
  IsOptional,
  IsIn,
  IsString,
  Min,
  Matches,
} from 'class-validator';
import { DateTimeISO8601 } from 'src/common/validators/datetime-format';

export class RolesQueryDto {
  @IsOptional() @IsInt() @Min(0) offset?: number;
  @IsOptional() @IsInt() @Min(1) limit?: number;

  @IsOptional() @IsInt() id?: number;
  @IsOptional() @IsString() role_id?: string;
  @IsOptional() @IsString() role_name?: string;

  @IsOptional()
  @Matches(DateTimeISO8601, { message: 'from must be YYYY-MM-DDTHH:mm:ssZ' })
  from?: string;

  @IsOptional()
  @Matches(DateTimeISO8601, { message: 'from must be YYYY-MM-DDTHH:mm:ssZ' })
  to?: string;

  @IsOptional() @IsIn(['ACTIVE', 'INACTIVE']) status?: 'ACTIVE' | 'INACTIVE';
  @IsOptional() all?: boolean;
}
