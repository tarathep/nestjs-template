import { ApiProperty } from '@nestjs/swagger';

export class PermissionsResponseDto {
  @ApiProperty() permission_id: string;
  @ApiProperty() permission_name: string;
  @ApiProperty() description: string;
}
