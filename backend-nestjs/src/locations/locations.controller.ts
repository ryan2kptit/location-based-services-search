import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ILocationsService } from './interfaces/locations-service.interface';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { NearbyUsersDto } from './dto/nearby-users.dto';
import { LocationHistoryDto } from './dto/location-history.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { UserLocation } from './entities/user-location.entity';

@ApiTags('Locations')
@ApiBearerAuth('JWT-auth')
@Controller('locations')
export class LocationsController {
  constructor(
    @Inject('ILocationsService')
    private readonly locationsService: ILocationsService,
  ) {}

  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute for write operations
  @Post('track')
  @ApiOperation({ summary: 'Track user location' })
  @ApiResponse({
    status: 201,
    description: 'Location tracked successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests',
  })
  async trackLocation(
    @CurrentUser() user: User,
    @Body() createLocationDto: CreateLocationDto,
  ): Promise<UserLocation> {
    return this.locationsService.trackLocation(user.id, createLocationDto);
  }

  @Get('current')
  @ApiOperation({ summary: 'Get current user location' })
  @ApiResponse({
    status: 200,
    description: 'Current location retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'No current location found',
  })
  async getCurrentLocation(
    @CurrentUser() user: User,
  ): Promise<UserLocation | null> {
    return this.locationsService.getCurrentLocation(user.id);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get location history' })
  @ApiResponse({
    status: 200,
    description: 'Location history retrieved successfully',
  })
  async getLocationHistory(
    @CurrentUser() user: User,
    @Query() dto: LocationHistoryDto,
  ): Promise<UserLocation[]> {
    return this.locationsService.getLocationHistory(user.id, dto.limit);
  }

  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute for write operations
  @Put(':id')
  @ApiOperation({ summary: 'Update a location record' })
  @ApiResponse({
    status: 200,
    description: 'Location updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Location not found',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests',
  })
  async updateLocation(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() updateLocationDto: UpdateLocationDto,
  ): Promise<UserLocation> {
    return this.locationsService.updateLocation(user.id, id, updateLocationDto);
  }

  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute for write operations
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a location record' })
  @ApiResponse({
    status: 204,
    description: 'Location deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Location not found',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests',
  })
  async deleteLocation(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<void> {
    return this.locationsService.deleteLocation(user.id, id);
  }

  @Get('nearby-users')
  @ApiOperation({ summary: 'Find nearby users' })
  @ApiResponse({
    status: 200,
    description: 'Nearby users retrieved successfully',
  })
  async getNearbyUsers(@Query() dto: NearbyUsersDto): Promise<any[]> {
    return this.locationsService.getNearbyUsers(
      dto.latitude,
      dto.longitude,
      dto.radius,
      dto.limit,
    );
  }
}
