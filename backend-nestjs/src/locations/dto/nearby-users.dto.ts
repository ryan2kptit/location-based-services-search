import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Min, Max } from 'class-validator';

export class NearbyUsersDto {
  @ApiProperty({ description: 'Latitude', example: 10.762622 })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ description: 'Longitude', example: 106.660172 })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiPropertyOptional({
    description: 'Search radius in meters',
    default: 5000,
    example: 5000,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  radius?: number = 5000;

  @ApiPropertyOptional({
    description: 'Number of results',
    default: 20,
    example: 20,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
