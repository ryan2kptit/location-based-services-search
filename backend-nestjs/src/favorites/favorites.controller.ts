import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Query,
  Inject,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IFavoritesService } from './interfaces/favorites-service.interface';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { FavoritesByTypeDto } from './dto/favorites-by-type.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { Favorite } from './entities/favorite.entity';

@ApiTags('Favorites')
@ApiBearerAuth('JWT-auth')
@Controller('favorites')
export class FavoritesController {
  constructor(
    @Inject('IFavoritesService')
    private readonly favoritesService: IFavoritesService,
  ) {}

  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute for write operations
  @Post()
  @ApiOperation({ summary: 'Add a service to favorites' })
  @ApiResponse({
    status: 201,
    description: 'Service added to favorites successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Service not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Service is already in favorites',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests',
  })
  async create(
    @CurrentUser() user: User,
    @Body() createFavoriteDto: CreateFavoriteDto,
  ): Promise<Favorite> {
    return this.favoritesService.create(user.id, createFavoriteDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all favorites for current user' })
  @ApiResponse({
    status: 200,
    description: 'Favorites retrieved successfully',
  })
  async findAll(@CurrentUser() user: User): Promise<Favorite[]> {
    return this.favoritesService.findAll(user.id);
  }

  @Get('by-type')
  @ApiOperation({ summary: 'Get favorites by service type' })
  @ApiResponse({
    status: 200,
    description: 'Favorites retrieved successfully',
  })
  async getFavoritesByType(
    @CurrentUser() user: User,
    @Query() dto: FavoritesByTypeDto,
  ): Promise<Favorite[]> {
    return this.favoritesService.getFavoritesByServiceType(
      user.id,
      dto.serviceTypeId,
    );
  }

  @Get('check/:serviceId')
  @ApiOperation({ summary: 'Check if a service is favorited' })
  @ApiResponse({
    status: 200,
    description: 'Favorite status retrieved',
  })
  async isFavorite(
    @CurrentUser() user: User,
    @Param('serviceId') serviceId: string,
  ): Promise<{ isFavorite: boolean }> {
    const isFavorite = await this.favoritesService.isFavorite(
      user.id,
      serviceId,
    );
    return { isFavorite };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a favorite by ID' })
  @ApiResponse({
    status: 200,
    description: 'Favorite retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Favorite not found',
  })
  async findOne(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<Favorite> {
    return this.favoritesService.findOne(user.id, id);
  }

  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute for write operations
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a service from favorites' })
  @ApiResponse({
    status: 204,
    description: 'Favorite removed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Favorite not found',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests',
  })
  async remove(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<void> {
    return this.favoritesService.remove(user.id, id);
  }
}
