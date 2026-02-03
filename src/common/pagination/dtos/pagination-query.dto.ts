import { IsOptional, IsPositive, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationQueryDto {
  @ApiPropertyOptional({
    example: 10,
    description: 'Maximum number of items to return (must be > 0)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  limit?: number;

  @ApiPropertyOptional({
    example: 0,
    description:
      'Number of items to skip before starting to collect results (must be >= 0)',
  })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  offset?: number;
}
