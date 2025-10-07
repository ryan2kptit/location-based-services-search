import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Service, ServiceStatus } from '../entities/service.entity';
import { ServiceType } from '../entities/service-type.entity';
import { CreateServiceDto } from '../dto/create-service.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';
import { SearchServicesDto } from '../dto/search-services.dto';
import { IServicesService } from '../interfaces/services-service.interface';

export interface ServiceSearchResult extends Service {
  distance?: number;
}

export interface PaginatedServiceResult {
  data: ServiceSearchResult[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class ServicesService implements IServicesService {
  constructor(
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
    @InjectRepository(ServiceType)
    private serviceTypeRepository: Repository<ServiceType>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  async create(createServiceDto: CreateServiceDto): Promise<Service> {
    const { latitude, longitude, serviceTypeId, ...rest } = createServiceDto;

    // Verify service type exists
    const serviceType = await this.serviceTypeRepository.findOne({
      where: { id: serviceTypeId },
    });

    if (!serviceType) {
      throw new NotFoundException('Service type not found');
    }

    // Create service using raw query to avoid TypeORM's spatial transformation issues
    // MySQL POINT uses (X, Y) which is (longitude, latitude) in geographic context
    const { v4: uuidv4 } = require('uuid');
    const uuid = uuidv4();
    const insertQuery = `
      INSERT INTO services (
        id, name, description, address, latitude, longitude, location,
        phone, email, website, serviceTypeId, createdAt, updatedAt
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ST_SRID(POINT(?, ?), 4326),
        ?, ?, ?, ?, NOW(), NOW()
      )
    `;

    // POINT(X, Y) in MySQL uses (longitude, latitude) order for geographic coordinates
    await this.serviceRepository.query(insertQuery, [
      uuid,
      createServiceDto.name,
      createServiceDto.description || null,
      createServiceDto.address || null,
      latitude,   // Latitude column
      longitude,  // Longitude column
      longitude,  // POINT X coordinate (longitude)
      latitude,   // POINT Y coordinate (latitude)
      createServiceDto.phone || null,
      createServiceDto.email || null,
      createServiceDto.website || null,
      serviceTypeId,
    ]);

    // Fetch the created service
    const createdService = await this.serviceRepository.findOne({
      where: { id: uuid },
      relations: ['serviceType'],
    });

    if (!createdService) {
      throw new Error('Failed to create service');
    }

    // Invalidate caches - clear all search and popular services caches
    await this.invalidateServiceCaches();

    return createdService;
  }

  async search(
    searchDto: SearchServicesDto,
  ): Promise<PaginatedServiceResult> {
    const {
      latitude,
      longitude,
      radius = 5000,
      serviceTypeId,
      keyword,
      tags,
      minRating,
      page = 1,
      limit = 20,
    } = searchDto;

    // Generate cache key based on search parameters
    const cacheKey = `services:search:${latitude}:${longitude}:${radius}:${serviceTypeId || 'all'}:${keyword || 'none'}:${minRating || 'none'}:${tags?.join(',') || 'none'}:${page}:${limit}`;

    // Try cache first
    const cached = await this.cacheManager.get<PaginatedServiceResult>(cacheKey);
    if (cached) {
      return cached;
    }

    const offset = (page - 1) * limit;

    // Build query with MySQL spatial search
    let whereConditions = `s.status = '${ServiceStatus.ACTIVE}'`;
    const params: any[] = [longitude, latitude, radius];

    if (serviceTypeId) {
      whereConditions += ` AND s.serviceTypeId = ?`;
      params.push(serviceTypeId);
    }

    if (keyword) {
      whereConditions += ` AND (s.name LIKE ? OR s.description LIKE ?)`;
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (minRating !== undefined) {
      whereConditions += ` AND s.rating >= ?`;
      params.push(minRating);
    }

    if (tags && tags.length > 0) {
      const tagConditions = tags.map(() => `s.tags LIKE ?`).join(' OR ');
      whereConditions += ` AND (${tagConditions})`;
      tags.forEach(tag => params.push(`%${tag}%`));
    }

    // Count total results
    const countQuery = `
      SELECT COUNT(*) as total
      FROM services s
      WHERE ${whereConditions}
        AND ST_Distance_Sphere(
          s.location,
          ST_PointFromText('POINT(? ?)', 4326)
        ) <= ?
    `;

    // Build params in the order they appear in the count query
    const countParams: any[] = [];
    // First: WHERE clause params
    if (serviceTypeId) countParams.push(serviceTypeId);
    if (keyword) countParams.push(`%${keyword}%`, `%${keyword}%`);
    if (minRating !== undefined) countParams.push(minRating);
    if (tags && tags.length > 0) tags.forEach(tag => countParams.push(`%${tag}%`));
    // Then: ST_Distance_Sphere params (POINT format: latitude, longitude for this MySQL config)
    countParams.push(latitude, longitude, radius);

    const countResult = await this.serviceRepository.query(countQuery, countParams);
    const total = parseInt(countResult[0]?.total || '0', 10);

    // Search with proximity using ST_Distance_Sphere
    const searchQuery = `
      SELECT
        s.*,
        st.name as serviceTypeName,
        ST_Distance_Sphere(
          s.location,
          ST_PointFromText('POINT(? ?)', 4326)
        ) as distance
      FROM services s
      LEFT JOIN service_types st ON s.serviceTypeId = st.id
      WHERE ${whereConditions}
        AND ST_Distance_Sphere(
          s.location,
          ST_PointFromText('POINT(? ?)', 4326)
        ) <= ?
      ORDER BY distance ASC
      LIMIT ? OFFSET ?
    `;

    // Build params in the order they appear in the query
    const searchParams: any[] = [];
    // First: ST_Distance_Sphere in SELECT clause (line 162)
    searchParams.push(latitude, longitude);
    // Second: WHERE clause params
    if (serviceTypeId) searchParams.push(serviceTypeId);
    if (keyword) searchParams.push(`%${keyword}%`, `%${keyword}%`);
    if (minRating !== undefined) searchParams.push(minRating);
    if (tags && tags.length > 0) tags.forEach(tag => searchParams.push(`%${tag}%`));
    // Third: ST_Distance_Sphere in WHERE clause (line 169) + radius (line 170)
    searchParams.push(latitude, longitude, radius);
    // Finally: LIMIT and OFFSET
    searchParams.push(limit, offset);

    const results = await this.serviceRepository.query(searchQuery, searchParams);

    const searchResult = {
      data: results,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    // Store in cache with 5 minutes TTL
    await this.cacheManager.set(cacheKey, searchResult, 300);

    return searchResult;
  }

  async searchNearby(
    latitude: number,
    longitude: number,
    radiusInMeters: number = 5000,
    limit: number = 20,
  ): Promise<ServiceSearchResult[]> {
    // Use MySQL spatial search for nearest neighbor search
    const query = `
      SELECT
        s.*,
        st.name as serviceTypeName,
        ST_Distance_Sphere(
          s.location,
          ST_PointFromText('POINT(? ?)', 4326)
        ) as distance
      FROM services s
      LEFT JOIN service_types st ON s.serviceTypeId = st.id
      WHERE s.status = '${ServiceStatus.ACTIVE}'
        AND ST_Distance_Sphere(
          s.location,
          ST_PointFromText('POINT(? ?)', 4326)
        ) <= ?
      ORDER BY distance ASC
      LIMIT ?
    `;

    const results = await this.serviceRepository.query(query, [
      latitude,
      longitude,
      latitude,
      longitude,
      radiusInMeters,
      limit,
    ]);

    return results;
  }

  async findOne(id: string): Promise<Service> {
    const service = await this.serviceRepository.findOne({
      where: { id },
      relations: ['serviceType'],
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // Increment view count
    await this.serviceRepository.increment({ id }, 'viewCount', 1);

    return service;
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedServiceResult> {
    const cacheKey = `services:popular:${page}:${limit}`;

    // Try cache first
    const cached = await this.cacheManager.get<PaginatedServiceResult>(cacheKey);
    if (cached) {
      return cached;
    }

    // Cache miss - fetch from DB
    const [data, total] = await this.serviceRepository.findAndCount({
      where: { status: ServiceStatus.ACTIVE },
      relations: ['serviceType'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const result = {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    // Store in cache with 10 minutes TTL
    await this.cacheManager.set(cacheKey, result, 600);

    return result;
  }

  async update(id: string, updateServiceDto: UpdateServiceDto): Promise<Service> {
    const service = await this.findOne(id);

    const { latitude, longitude, serviceTypeId, ...rest } = updateServiceDto;

    if (serviceTypeId) {
      const serviceType = await this.serviceTypeRepository.findOne({
        where: { id: serviceTypeId },
      });

      if (!serviceType) {
        throw new NotFoundException('Service type not found');
      }

      service.serviceTypeId = serviceTypeId;
    }

    if (latitude !== undefined && longitude !== undefined) {
      service.latitude = latitude;
      service.longitude = longitude;
      service.location = `POINT(${longitude} ${latitude})` as any;
    }

    Object.assign(service, rest);

    const updatedService = await this.serviceRepository.save(service);

    // Invalidate caches - clear all search and popular services caches
    await this.invalidateServiceCaches();

    return updatedService;
  }

  async remove(id: string): Promise<void> {
    const service = await this.findOne(id);

    // Soft delete
    service.deletedAt = new Date();
    service.status = ServiceStatus.CLOSED;
    await this.serviceRepository.save(service);

    // Invalidate caches - clear all search and popular services caches
    await this.invalidateServiceCaches();
  }

  async getServiceTypes(): Promise<ServiceType[]> {
    const cacheKey = 'service-types:all';

    // Try cache first
    const cached = await this.cacheManager.get<ServiceType[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Cache miss - fetch from DB
    const types = await this.serviceTypeRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });

    // Store in cache with 1 hour TTL
    await this.cacheManager.set(cacheKey, types, 3600);

    return types;
  }

  async getServiceType(id: string): Promise<ServiceType> {
    const serviceType = await this.serviceTypeRepository.findOne({
      where: { id },
    });

    if (!serviceType) {
      throw new NotFoundException('Service type not found');
    }

    return serviceType;
  }

  /**
   * Invalidate all service-related caches
   * Called when services are created, updated, or deleted
   */
  private async invalidateServiceCaches(): Promise<void> {
    // Clear all search result caches (pattern: services:search:*)
    // Clear all popular services caches (pattern: services:popular:*)
    // Note: cache-manager doesn't support pattern-based deletion by default
    // so we'll use the store's native del method if available

    const store = this.cacheManager.store as any;
    if (store && store.keys) {
      // Get all keys matching our patterns
      const keys = await store.keys();
      const keysToDelete = keys.filter((key: string) =>
        key.startsWith('services:search:') ||
        key.startsWith('services:popular:')
      );

      // Delete each key
      for (const key of keysToDelete) {
        await this.cacheManager.del(key);
      }
    }
  }
}
