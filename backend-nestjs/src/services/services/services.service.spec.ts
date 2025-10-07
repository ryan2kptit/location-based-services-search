import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ServicesService } from './services.service';
import { Service, ServiceStatus } from '../entities/service.entity';
import { ServiceType } from '../entities/service-type.entity';
import { TestDataFactory } from '../../../test/utils/test-data.factory';
import { SpatialHelper } from '../../../test/utils/spatial.helper';
import { createMockRepository, resetMocks } from '../../../test/utils/database.helper';

describe('ServicesService', () => {
  let service: ServicesService;
  let serviceRepository: ReturnType<typeof createMockRepository>;
  let serviceTypeRepository: ReturnType<typeof createMockRepository>;
  let mockCacheManager: any;

  beforeEach(async () => {
    serviceRepository = createMockRepository();
    serviceTypeRepository = createMockRepository();

    // Mock cache manager
    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      reset: jest.fn(),
      store: {
        keys: jest.fn().mockResolvedValue([]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        {
          provide: getRepositoryToken(Service),
          useValue: serviceRepository,
        },
        {
          provide: getRepositoryToken(ServiceType),
          useValue: serviceTypeRepository,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
  });

  afterEach(() => {
    resetMocks(serviceRepository, serviceTypeRepository);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create service with MySQL POINT using raw query', async () => {
      // Arrange
      const serviceType = TestDataFactory.createServiceType();
      const createServiceDto = {
        name: 'Test Service',
        description: 'Test description',
        serviceTypeId: serviceType.id,
        latitude: 21.0285,
        longitude: 105.8542,
        address: '123 Test St',
      };

      const mockService = TestDataFactory.createService({
        ...createServiceDto,
        serviceTypeId: serviceType.id,
      });

      serviceTypeRepository.findOne.mockResolvedValue(serviceType);
      serviceRepository.query.mockResolvedValue({ insertId: 1 });
      serviceRepository.findOne.mockResolvedValue(mockService);

      // Act
      const result = await service.create(createServiceDto);

      // Assert
      expect(serviceRepository.query).toHaveBeenCalled();
      expect(result).toEqual(mockService);
      const insertQuery = serviceRepository.query.mock.calls[0][0];
      expect(insertQuery).toContain('ST_SRID(POINT(?, ?), 4326)');
    });

    it('should throw NotFoundException when service type not found', async () => {
      // Arrange
      const createServiceDto = {
        name: 'Test Service',
        serviceTypeId: 'nonexistent-type-id',
        latitude: 21.0285,
        longitude: 105.8542,
      };

      serviceTypeRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(createServiceDto)).rejects.toThrow(NotFoundException);
      await expect(service.create(createServiceDto)).rejects.toThrow('Service type not found');
    });

    it('should set all service properties correctly', async () => {
      // Arrange
      const serviceType = TestDataFactory.createServiceType();
      const createServiceDto = {
        name: 'Test Service',
        description: 'Test description',
        serviceTypeId: serviceType.id,
        latitude: 21.0285,
        longitude: 105.8542,
        address: '123 Test St',
        city: 'Hanoi',
        phone: '+84123456789',
        tags: ['restaurant', 'vietnamese'],
      };

      const mockService = TestDataFactory.createService(createServiceDto);

      serviceTypeRepository.findOne.mockResolvedValue(serviceType);
      serviceRepository.query.mockResolvedValue({ insertId: 1 });
      serviceRepository.findOne.mockResolvedValue(mockService);

      // Act
      const result = await service.create(createServiceDto);

      // Assert
      expect(result.name).toBe(createServiceDto.name);
      expect(result.description).toBe(createServiceDto.description);
    });
  });

  describe('search', () => {
    it('should search services by radius using ST_Distance_Sphere', async () => {
      // Arrange
      const searchDto = {
        latitude: 21.0285,
        longitude: 105.8542,
        radius: 5000,
        page: 1,
        limit: 20,
      };

      serviceRepository.query
        .mockResolvedValueOnce([{ total: '2' }]) // Count query
        .mockResolvedValueOnce([
          // Search query
          { ...TestDataFactory.createService(), distance: 1000 },
          { ...TestDataFactory.createService(), distance: 3000 },
        ]);

      // Act
      const result = await service.search(searchDto);

      // Assert
      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(serviceRepository.query).toHaveBeenCalledTimes(2);
      const searchQuery = serviceRepository.query.mock.calls[1][0];
      expect(searchQuery).toContain('ST_Distance_Sphere');
      expect(searchQuery).toContain('ST_PointFromText');
    });

    it('should filter by service type', async () => {
      // Arrange
      const searchDto = {
        latitude: 21.0285,
        longitude: 105.8542,
        radius: 5000,
        serviceTypeId: 'type-id',
        page: 1,
        limit: 20,
      };

      serviceRepository.query
        .mockResolvedValueOnce([{ total: '1' }])
        .mockResolvedValueOnce([TestDataFactory.createService()]);

      // Act
      await service.search(searchDto);

      // Assert
      const countQuery = serviceRepository.query.mock.calls[0][0];
      expect(countQuery).toContain('serviceTypeId');
    });

    it('should filter by keyword in name and description', async () => {
      // Arrange
      const searchDto = {
        latitude: 21.0285,
        longitude: 105.8542,
        radius: 5000,
        keyword: 'restaurant',
        page: 1,
        limit: 20,
      };

      serviceRepository.query
        .mockResolvedValueOnce([{ total: '1' }])
        .mockResolvedValueOnce([TestDataFactory.createService()]);

      // Act
      await service.search(searchDto);

      // Assert
      const searchQuery = serviceRepository.query.mock.calls[1][0];
      expect(searchQuery).toContain('LIKE');
    });

    it('should filter by minimum rating', async () => {
      // Arrange
      const searchDto = {
        latitude: 21.0285,
        longitude: 105.8542,
        radius: 5000,
        minRating: 4.0,
        page: 1,
        limit: 20,
      };

      serviceRepository.query
        .mockResolvedValueOnce([{ total: '1' }])
        .mockResolvedValueOnce([TestDataFactory.createService({ rating: 4.5 })]);

      // Act
      await service.search(searchDto);

      // Assert
      const searchQuery = serviceRepository.query.mock.calls[1][0];
      expect(searchQuery).toContain('rating >=');
    });

    it('should filter by tags', async () => {
      // Arrange
      const searchDto = {
        latitude: 21.0285,
        longitude: 105.8542,
        radius: 5000,
        tags: ['restaurant', 'vietnamese'],
        page: 1,
        limit: 20,
      };

      serviceRepository.query
        .mockResolvedValueOnce([{ total: '1' }])
        .mockResolvedValueOnce([TestDataFactory.createService()]);

      // Act
      await service.search(searchDto);

      // Assert
      const searchQuery = serviceRepository.query.mock.calls[1][0];
      expect(searchQuery).toContain('tags LIKE');
    });

    it('should handle pagination correctly', async () => {
      // Arrange
      const searchDto = {
        latitude: 21.0285,
        longitude: 105.8542,
        radius: 5000,
        page: 2,
        limit: 10,
      };

      serviceRepository.query
        .mockResolvedValueOnce([{ total: '25' }])
        .mockResolvedValueOnce([]);

      // Act
      const result = await service.search(searchDto);

      // Assert
      expect(result.meta.page).toBe(2);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.totalPages).toBe(3);
      const params = serviceRepository.query.mock.calls[1][1];
      expect(params[params.length - 2]).toBe(10); // limit
      expect(params[params.length - 1]).toBe(10); // offset (page 2 * limit 10)
    });

    it('should order results by distance', async () => {
      // Arrange
      const searchDto = {
        latitude: 21.0285,
        longitude: 105.8542,
        radius: 5000,
        page: 1,
        limit: 20,
      };

      serviceRepository.query
        .mockResolvedValueOnce([{ total: '2' }])
        .mockResolvedValueOnce([
          { ...TestDataFactory.createService(), distance: 1000 },
          { ...TestDataFactory.createService(), distance: 3000 },
        ]);

      // Act
      await service.search(searchDto);

      // Assert
      const searchQuery = serviceRepository.query.mock.calls[1][0];
      expect(searchQuery).toContain('ORDER BY distance ASC');
    });

    it('should only return active services', async () => {
      // Arrange
      const searchDto = {
        latitude: 21.0285,
        longitude: 105.8542,
        radius: 5000,
        page: 1,
        limit: 20,
      };

      serviceRepository.query
        .mockResolvedValueOnce([{ total: '1' }])
        .mockResolvedValueOnce([TestDataFactory.createService()]);

      // Act
      await service.search(searchDto);

      // Assert
      const searchQuery = serviceRepository.query.mock.calls[1][0];
      expect(searchQuery).toContain("status = 'active'");
    });

    it('should return empty results when no services found', async () => {
      // Arrange
      const searchDto = {
        latitude: 21.0285,
        longitude: 105.8542,
        radius: 5000,
        page: 1,
        limit: 20,
      };

      serviceRepository.query
        .mockResolvedValueOnce([{ total: '0' }])
        .mockResolvedValueOnce([]);

      // Act
      const result = await service.search(searchDto);

      // Assert
      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });
  });

  describe('searchNearby', () => {
    it('should use ST_Distance_Sphere for nearest neighbor search', async () => {
      // Arrange
      const latitude = 21.0285;
      const longitude = 105.8542;
      const radiusInMeters = 5000;

      serviceRepository.query.mockResolvedValue([
        { ...TestDataFactory.createService(), distance: 1000 },
      ]);

      // Act
      await service.searchNearby(latitude, longitude, radiusInMeters);

      // Assert
      const query = serviceRepository.query.mock.calls[0][0];
      expect(query).toContain('ST_Distance_Sphere');
      expect(query).toContain('ST_PointFromText');
    });

    it('should respect limit parameter', async () => {
      // Arrange
      const latitude = 21.0285;
      const longitude = 105.8542;
      const limit = 10;

      serviceRepository.query.mockResolvedValue([]);

      // Act
      await service.searchNearby(latitude, longitude, 5000, limit);

      // Assert
      const params = serviceRepository.query.mock.calls[0][1];
      // Params order: [lat, lng, lat, lng, radius, limit, offset]
      expect(params[5]).toBe(limit);
    });

    it('should calculate distances correctly', async () => {
      // Arrange
      const { lat: lat1, lng: lng1 } = TestDataFactory.COORDINATES.hanoi;
      const { lat: lat2, lng: lng2 } = TestDataFactory.COORDINATES.hcmc;

      const expectedDistance = SpatialHelper.calculateDistance(lat1, lng1, lat2, lng2);

      serviceRepository.query.mockResolvedValue([
        {
          ...TestDataFactory.createService({ latitude: lat2, longitude: lng2 }),
          distance: expectedDistance,
        },
      ]);

      // Act
      const result = await service.searchNearby(lat1, lng1, 2000000);

      // Assert
      expect(result[0].distance).toBeCloseTo(expectedDistance, -2);
    });
  });

  describe('findOne', () => {
    it('should return service with service type relation', async () => {
      // Arrange
      const testService = TestDataFactory.createService();
      serviceRepository.findOne.mockResolvedValue(testService);
      serviceRepository.increment.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });

      // Act
      const result = await service.findOne(testService.id);

      // Assert
      expect(result).toEqual(testService);
      expect(serviceRepository.findOne).toHaveBeenCalledWith({
        where: { id: testService.id },
        relations: ['serviceType'],
      });
    });

    it('should increment view count', async () => {
      // Arrange
      const testService = TestDataFactory.createService();
      serviceRepository.findOne.mockResolvedValue(testService);
      serviceRepository.increment.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });

      // Act
      await service.findOne(testService.id);

      // Assert
      expect(serviceRepository.increment).toHaveBeenCalledWith({ id: testService.id }, 'viewCount', 1);
    });

    it('should throw NotFoundException when service not found', async () => {
      // Arrange
      serviceRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne('nonexistent-id')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('nonexistent-id')).rejects.toThrow('Service not found');
    });
  });

  describe('findAll', () => {
    it('should return paginated services', async () => {
      // Arrange
      const services = TestDataFactory.createServicesAtLocations(3);
      serviceRepository.findAndCount.mockResolvedValue([services, 3]);

      // Act
      const result = await service.findAll(1, 20);

      // Assert
      expect(result.data).toEqual(services);
      expect(result.meta.total).toBe(3);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
    });

    it('should only return active services', async () => {
      // Arrange
      serviceRepository.findAndCount.mockResolvedValue([[], 0]);

      // Act
      await service.findAll();

      // Assert
      expect(serviceRepository.findAndCount).toHaveBeenCalledWith({
        where: { status: ServiceStatus.ACTIVE },
        relations: ['serviceType'],
        skip: 0,
        take: 20,
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('update', () => {
    it('should update service coordinates and MySQL POINT', async () => {
      // Arrange
      const testService = TestDataFactory.createService();
      const updateDto = {
        latitude: 10.8231,
        longitude: 106.6297,
      };

      serviceRepository.findOne.mockResolvedValue(testService);
      serviceRepository.increment.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });
      serviceRepository.save.mockImplementation((data) => Promise.resolve(data as Service));

      // Act
      const result = await service.update(testService.id, updateDto);

      // Assert
      expect(result.latitude).toBe(updateDto.latitude);
      expect(result.longitude).toBe(updateDto.longitude);
      // MySQL location is stored as POINT string, not GeoJSON object
      expect(result.location).toBeDefined();
    });

    it('should update service type when provided', async () => {
      // Arrange
      const testService = TestDataFactory.createService();
      const newServiceType = TestDataFactory.createServiceType({ id: 'new-type-id' });
      const updateDto = {
        serviceTypeId: newServiceType.id,
      };

      serviceRepository.findOne.mockResolvedValue(testService);
      serviceRepository.increment.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });
      serviceTypeRepository.findOne.mockResolvedValue(newServiceType);
      serviceRepository.save.mockImplementation((data) => Promise.resolve(data as Service));

      // Act
      const result = await service.update(testService.id, updateDto);

      // Assert
      expect(result.serviceTypeId).toBe(newServiceType.id);
    });

    it('should throw NotFoundException when service type not found', async () => {
      // Arrange
      const testService = TestDataFactory.createService();
      const updateDto = {
        serviceTypeId: 'nonexistent-type-id',
      };

      serviceRepository.findOne.mockResolvedValue(testService);
      serviceRepository.increment.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });
      serviceTypeRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.update(testService.id, updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete service', async () => {
      // Arrange
      const testService = TestDataFactory.createService();

      serviceRepository.findOne.mockResolvedValue(testService);
      serviceRepository.increment.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });
      serviceRepository.save.mockImplementation((data) => Promise.resolve(data as Service));

      // Act
      await service.remove(testService.id);

      // Assert
      const savedService = serviceRepository.save.mock.calls[0][0];
      expect(savedService.deletedAt).toBeInstanceOf(Date);
      expect(savedService.status).toBe(ServiceStatus.CLOSED);
    });
  });

  describe('getServiceTypes', () => {
    it('should return active service types ordered by name', async () => {
      // Arrange
      const serviceTypes = [
        TestDataFactory.createServiceType({ name: 'Cafe' }),
        TestDataFactory.createServiceType({ name: 'Restaurant' }),
      ];

      serviceTypeRepository.find.mockResolvedValue(serviceTypes);

      // Act
      const result = await service.getServiceTypes();

      // Assert
      expect(result).toEqual(serviceTypes);
      expect(serviceTypeRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { name: 'ASC' },
      });
    });
  });

  describe('getServiceType', () => {
    it('should return service type by id', async () => {
      // Arrange
      const serviceType = TestDataFactory.createServiceType();
      serviceTypeRepository.findOne.mockResolvedValue(serviceType);

      // Act
      const result = await service.getServiceType(serviceType.id);

      // Assert
      expect(result).toEqual(serviceType);
    });

    it('should throw NotFoundException when service type not found', async () => {
      // Arrange
      serviceTypeRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getServiceType('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });
});
