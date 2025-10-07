import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
  IsEnum,
} from 'class-validator';

export class CreateLocationDto {
  @ApiProperty({
    description: 'Location name',
    example: 'Home',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Address',
    example: '123 Main St, San Francisco, CA 94102',
  })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({
    description: 'Latitude (-90 to 90)',
    example: 37.7749,
    minimum: -90,
    maximum: 90,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({
    description: 'Longitude (-180 to 180)',
    example: -122.4194,
    minimum: -180,
    maximum: 180,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({
    description: 'Location type',
    enum: ['home', 'work', 'other'],
    example: 'home',
    required: false,
  })
  @IsOptional()
  @IsEnum(['home', 'work', 'other'])
  type?: string;

  @ApiProperty({
    description: 'Is this the default location',
    example: false,
    required: false,
  })
  @IsOptional()
  isDefault?: boolean;
}
