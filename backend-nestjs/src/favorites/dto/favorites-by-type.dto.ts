import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class FavoritesByTypeDto {
  @ApiProperty({
    description: 'Service type ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsUUID()
  serviceTypeId: string;
}
