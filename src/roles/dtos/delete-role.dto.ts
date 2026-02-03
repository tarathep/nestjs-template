import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeleteRoleDto {
  @ApiProperty({
    example: 1,
    description: 'ID of the role to delete (must be a positive integer)',
  })
  @IsInt()
  @Min(1)
  id!: number;
}
