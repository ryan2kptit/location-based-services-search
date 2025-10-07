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
import { IServicesService } from './interfaces/services-service.interface';
import { PaginatedServiceResult } from './services/services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { SearchServicesDto } from './dto/search-services.dto';
import { NearbyServicesDto } from './dto/nearby-services.dto';
import { PaginationDto } from './dto/pagination.dto';
import { Service } from './entities/service.entity';
import { ServiceType } from './entities/service-type.entity';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Services')
@Controller('services')
export class ServicesController {
  constructor(
    @Inject('IServicesService')
    private readonly servicesService: IServicesService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 50, ttl: 60000 } }) // 50 requests per minute for search
  @Get('search')
  @ApiOperation({ summary: 'Search for services by location and filters' })
  @ApiResponse({
    status: 200,
    description: 'Services retrieved successfully',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests',
  })
  async search(
    @Query() searchDto: SearchServicesDto,
  ): Promise<PaginatedServiceResult> {
    return this.servicesService.search(searchDto);
  }

  @Public()
  @Throttle({ default: { limit: 50, ttl: 60000 } }) // 50 requests per minute for search
  @Get('nearby')
  @ApiOperation({ summary: 'Find nearby services (optimized with KNN)' })
  @ApiResponse({
    status: 200,
    description: 'Nearby services retrieved successfully',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests',
  })
  async searchNearby(@Query() dto: NearbyServicesDto): Promise<any[]> {
    return this.servicesService.searchNearby(
      dto.latitude,
      dto.longitude,
      dto.radius,
      dto.limit,
    );
  }

  @Public()
  @Get('types')
  @ApiOperation({ summary: 'Get all service types' })
  @ApiResponse({
    status: 200,
    description: 'Service types retrieved successfully',
  })
  async getServiceTypes(): Promise<ServiceType[]> {
    return this.servicesService.getServiceTypes();
  }

  @Public()
  @Get('types/:id')
  @ApiOperation({ summary: 'Get service type by ID' })
  @ApiResponse({
    status: 200,
    description: 'Service type retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Service type not found',
  })
  async getServiceType(@Param('id') id: string): Promise<ServiceType> {
    return this.servicesService.getServiceType(id);
  }

  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute for write operations
  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new service (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Service created successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests',
  })
  async create(@Body() createServiceDto: CreateServiceDto): Promise<Service> {
    return this.servicesService.create(createServiceDto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all services with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Services retrieved successfully',
  })
  async findAll(@Query() dto: PaginationDto): Promise<PaginatedServiceResult> {
    return this.servicesService.findAll(dto.page, dto.limit);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get service by ID' })
  @ApiResponse({
    status: 200,
    description: 'Service retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Service not found',
  })
  async findOne(@Param('id') id: string): Promise<Service> {
    return this.servicesService.findOne(id);
  }

  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute for write operations
  @Put(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a service (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Service updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Service not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests',
  })
  async update(
    @Param('id') id: string,
    @Body() updateServiceDto: UpdateServiceDto,
  ): Promise<Service> {
    return this.servicesService.update(id, updateServiceDto);
  }

  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute for write operations
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a service (Admin only)' })
  @ApiResponse({
    status: 204,
    description: 'Service deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Service not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return this.servicesService.remove(id);
  }
}
