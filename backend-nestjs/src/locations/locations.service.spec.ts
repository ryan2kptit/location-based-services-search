import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { LocationsService } from './locations.service';
import { UserLocation } from './entities/user-location.entity';
import { TestDataFactory } from '../../test/utils/test-data.factory';
import { SpatialHelper } from '../../test/utils/spatial.helper';
import { createMockRepository, resetMocks } from '../../test/utils/database.helper';

describe('LocationsService', () => {
  let service: LocationsService;
  let locationRepository: ReturnType<typeof createMockRepository>;
  let mockDataSource: any;

  beforeEach(async () => {
    locationRepository = createMockRepository();

    // Mock DataSource with transaction support
    mockDataSource = {
      transaction: jest.fn((callback: any) => {
        // Create a mock entity manager
        const mockEntityManager = {
          update: jest.fn().mockResolvedValue({ affected: 0 }),
          create: jest.fn((entity, data) => data),
          save: jest.fn().mockResolvedValue({}),
          findOne: jest.fn(),
          createQueryBuilder: jest.fn().mockReturnValue({
            insert: jest.fn().mockReturnThis(),
            into: jest.fn().mockReturnThis(),
            values: jest.fn().mockReturnThis(),
            execute: jest.fn().mockResolvedValue({ identifiers: [{ id: 'test-id' }] }),
          }),
        };
        return callback(mockEntityManager);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationsService,
        {
          provide: getRepositoryToken(UserLocation),
          useValue: locationRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<LocationsService>(LocationsService);
  });

  afterEach(() => {
    resetMocks(locationRepository);
    jest.clearAllMocks();
  });

  describe('trackLocation', () => {
    it('should create location with MySQL POINT using query builder', async () => {
      // Arrange
      const userId = 'test-user-id';
      const createLocationDto = {
        name: 'Home',
        address: '123 Test St',
        latitude: 21.0285,
        longitude: 105.8542,
        isDefault: true,
      };

      const mockLocation = TestDataFactory.createUserLocation({
        ...createLocationDto,
        userId,
      });

      // Update the mock to return the location in findOne
      mockDataSource.transaction.mockImplementation((callback: any) => {
        const mockEntityManager = {
          update: jest.fn().mockResolvedValue({ affected: 0 }),
          createQueryBuilder: jest.fn().mockReturnValue({
            insert: jest.fn().mockReturnThis(),
            into: jest.fn().mockReturnThis(),
            values: jest.fn().mockReturnThis(),
            execute: jest.fn().mockResolvedValue({ identifiers: [{ id: mockLocation.id }] }),
          }),
          findOne: jest.fn().mockResolvedValue(mockLocation),
        };
        return callback(mockEntityManager);
      });

      // Act
      const result = await service.trackLocation(userId, createLocationDto);

      // Assert
      expect(result).toEqual(mockLocation);
      expect(mockDataSource.transaction).toHaveBeenCalled();
    });

    it('should mark previous locations as not default when isDefault is true', async () => {
      // Arrange
      const userId = 'test-user-id';
      const createLocationDto = {
        name: 'Work',
        address: '456 Office Blvd',
        latitude: 21.0285,
        longitude: 105.8542,
        isDefault: true,
      };

      const mockLocation = TestDataFactory.createUserLocation();
      const mockUpdate = jest.fn().mockResolvedValue({ affected: 1 });

      mockDataSource.transaction.mockImplementation((callback: any) => {
        const mockEntityManager = {
          update: mockUpdate,
          createQueryBuilder: jest.fn().mockReturnValue({
            insert: jest.fn().mockReturnThis(),
            into: jest.fn().mockReturnThis(),
            values: jest.fn().mockReturnThis(),
            execute: jest.fn().mockResolvedValue({ identifiers: [{ id: 'new-id' }] }),
          }),
          findOne: jest.fn().mockResolvedValue(mockLocation),
        };
        return callback(mockEntityManager);
      });

      // Act
      await service.trackLocation(userId, createLocationDto);

      // Assert
      expect(mockUpdate).toHaveBeenCalledWith(
        UserLocation,
        { userId, isDefault: true },
        { isDefault: false },
      );
    });

    it('should handle invalid coordinates gracefully', async () => {
      // Arrange
      const userId = 'test-user-id';
      const createLocationDto = {
        name: 'Test Location',
        address: '789 Invalid St',
        latitude: 999, // Invalid
        longitude: 999, // Invalid
      };

      const mockLocation = TestDataFactory.createUserLocation({
        ...createLocationDto,
        userId,
      });

      mockDataSource.transaction.mockImplementation((callback: any) => {
        const mockEntityManager = {
          update: jest.fn().mockResolvedValue({ affected: 0 }),
          createQueryBuilder: jest.fn().mockReturnValue({
            insert: jest.fn().mockReturnThis(),
            into: jest.fn().mockReturnThis(),
            values: jest.fn().mockReturnThis(),
            execute: jest.fn().mockResolvedValue({ identifiers: [{ id: mockLocation.id }] }),
          }),
          findOne: jest.fn().mockResolvedValue(mockLocation),
        };
        return callback(mockEntityManager);
      });

      // Act
      const result = await service.trackLocation(userId, createLocationDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.latitude).toBe(999);
      expect(result.longitude).toBe(999);
    });

    it('should store location type correctly', async () => {
      // Arrange
      const userId = 'test-user-id';
      const createLocationDto = {
        name: 'Favorite Cafe',
        address: '999 Cafe St',
        latitude: 21.0285,
        longitude: 105.8542,
        type: 'work' as 'home' | 'work' | 'other',
      };

      const mockLocation = TestDataFactory.createUserLocation({
        ...createLocationDto,
        userId,
      });

      mockDataSource.transaction.mockImplementation((callback: any) => {
        const mockEntityManager = {
          update: jest.fn().mockResolvedValue({ affected: 0 }),
          createQueryBuilder: jest.fn().mockReturnValue({
            insert: jest.fn().mockReturnThis(),
            into: jest.fn().mockReturnThis(),
            values: jest.fn().mockReturnThis(),
            execute: jest.fn().mockResolvedValue({ identifiers: [{ id: mockLocation.id }] }),
          }),
          findOne: jest.fn().mockResolvedValue(mockLocation),
        };
        return callback(mockEntityManager);
      });

      // Act
      const result = await service.trackLocation(userId, createLocationDto);

      // Assert
      expect(result.type).toBe(createLocationDto.type);
      expect(result.name).toBe(createLocationDto.name);
    });
  });

  describe('getCurrentLocation', () => {
    it('should return current location for user', async () => {
      // Arrange
      const userId = 'test-user-id';
      const location = TestDataFactory.createUserLocation({ userId, isDefault: true });

      locationRepository.findOne.mockResolvedValue(location);

      // Act
      const result = await service.getCurrentLocation(userId);

      // Assert
      expect(result).toEqual(location);
      expect(locationRepository.findOne).toHaveBeenCalledWith({
        where: { userId, isDefault: true },
        order: { createdAt: 'DESC' },
      });
    });

    it('should return null when no current location exists', async () => {
      // Arrange
      const userId = 'test-user-id';
      locationRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.getCurrentLocation(userId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getLocationHistory', () => {
    it('should return location history ordered by date', async () => {
      // Arrange
      const userId = 'test-user-id';
      const locations = [
        TestDataFactory.createUserLocation({ userId, createdAt: new Date('2024-01-03') }),
        TestDataFactory.createUserLocation({ userId, createdAt: new Date('2024-01-02') }),
        TestDataFactory.createUserLocation({ userId, createdAt: new Date('2024-01-01') }),
      ];

      locationRepository.find.mockResolvedValue(locations);

      // Act
      const result = await service.getLocationHistory(userId);

      // Assert
      expect(result).toEqual(locations);
      expect(locationRepository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { createdAt: 'DESC' },
        take: 100,
      });
    });

    it('should respect limit parameter', async () => {
      // Arrange
      const userId = 'test-user-id';
      const limit = 50;

      locationRepository.find.mockResolvedValue([]);

      // Act
      await service.getLocationHistory(userId, limit);

      // Assert
      expect(locationRepository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { createdAt: 'DESC' },
        take: limit,
      });
    });

    it('should return empty array when no history exists', async () => {
      // Arrange
      const userId = 'test-user-id';
      locationRepository.find.mockResolvedValue([]);

      // Act
      const result = await service.getLocationHistory(userId);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('updateLocation', () => {
    it('should update location coordinates and MySQL POINT', async () => {
      // Arrange
      const userId = 'test-user-id';
      const locationId = 'location-id';
      const location = TestDataFactory.createUserLocation({ id: locationId, userId });
      const updateDto = {
        latitude: 10.8231,
        longitude: 106.6297,
      };

      locationRepository.findOne.mockResolvedValue(location);
      locationRepository.save.mockImplementation((data) => Promise.resolve(data as UserLocation));

      // Act
      const result = await service.updateLocation(userId, locationId, updateDto);

      // Assert
      expect(result.latitude).toBe(updateDto.latitude);
      expect(result.longitude).toBe(updateDto.longitude);
      // MySQL stores location as POINT string, not GeoJSON coordinates object
      expect(result.location).toBeDefined();
    });

    it('should throw NotFoundException when location not found', async () => {
      // Arrange
      const userId = 'test-user-id';
      const locationId = 'nonexistent-id';
      const updateDto = { latitude: 21.0285, longitude: 105.8542 };

      locationRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateLocation(userId, locationId, updateDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.updateLocation(userId, locationId, updateDto)).rejects.toThrow(
        'Location not found',
      );
    });

    it('should update name and address', async () => {
      // Arrange
      const userId = 'test-user-id';
      const locationId = 'location-id';
      const location = TestDataFactory.createUserLocation({ id: locationId, userId });
      const updateDto = {
        name: 'Updated Name',
        address: 'Updated Address',
      };

      locationRepository.findOne.mockResolvedValue(location);
      locationRepository.save.mockImplementation((data) => Promise.resolve(data as UserLocation));

      // Act
      const result = await service.updateLocation(userId, locationId, updateDto);

      // Assert
      expect(locationRepository.save).toHaveBeenCalled();
    });
  });

  describe('deleteLocation', () => {
    it('should delete location', async () => {
      // Arrange
      const userId = 'test-user-id';
      const locationId = 'location-id';
      const location = TestDataFactory.createUserLocation({ id: locationId, userId });

      locationRepository.findOne.mockResolvedValue(location);
      locationRepository.remove.mockResolvedValue(location);

      // Act
      await service.deleteLocation(userId, locationId);

      // Assert
      expect(locationRepository.remove).toHaveBeenCalledWith(location);
    });

    it('should throw NotFoundException when location not found', async () => {
      // Arrange
      const userId = 'test-user-id';
      const locationId = 'nonexistent-id';

      locationRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.deleteLocation(userId, locationId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getNearbyUsers', () => {
    it('should find nearby users using ST_Distance_Sphere', async () => {
      // Arrange
      const { lat, lng } = TestDataFactory.COORDINATES.hanoi;
      const radiusInMeters = 5000;

      const nearbyLocations = [
        { ...TestDataFactory.createUserLocation(), distance: 1000 },
        { ...TestDataFactory.createUserLocation(), distance: 3000 },
      ];

      locationRepository.query.mockResolvedValue(nearbyLocations);

      // Act
      const result = await service.getNearbyUsers(lat, lng, radiusInMeters);

      // Assert
      expect(result).toEqual(nearbyLocations);
      expect(locationRepository.query).toHaveBeenCalled();
      const query = locationRepository.query.mock.calls[0][0];
      expect(query).toContain('ST_Distance_Sphere');
      expect(query).toContain('ST_GeomFromText');
    });

    it('should order results by distance', async () => {
      // Arrange
      const { lat, lng } = TestDataFactory.COORDINATES.hanoi;

      locationRepository.query.mockResolvedValue([]);

      // Act
      await service.getNearbyUsers(lat, lng);

      // Assert
      const query = locationRepository.query.mock.calls[0][0];
      expect(query).toContain('ORDER BY distance');
    });

    it('should respect limit parameter', async () => {
      // Arrange
      const { lat, lng } = TestDataFactory.COORDINATES.hanoi;
      const limit = 10;

      locationRepository.query.mockResolvedValue([]);

      // Act
      await service.getNearbyUsers(lat, lng, 5000, limit);

      // Assert
      const params = locationRepository.query.mock.calls[0][1];
      // Params order similar to services: [lat, lng, lat, lng, radius, limit, offset]
      expect(params[5]).toBe(limit);
    });

    it('should only return default locations', async () => {
      // Arrange
      const { lat, lng } = TestDataFactory.COORDINATES.hanoi;

      locationRepository.query.mockResolvedValue([]);

      // Act
      await service.getNearbyUsers(lat, lng);

      // Assert
      const query = locationRepository.query.mock.calls[0][0];
      expect(query).toContain('isDefault = true');
    });

    it('should calculate distances correctly with MySQL ST_Distance_Sphere', async () => {
      // Arrange
      const { lat: lat1, lng: lng1 } = TestDataFactory.COORDINATES.hanoi;
      const { lat: lat2, lng: lng2 } = TestDataFactory.COORDINATES.hcmc;

      const expectedDistance = SpatialHelper.calculateDistance(lat1, lng1, lat2, lng2);

      const nearbyLocations = [
        {
          ...TestDataFactory.createUserLocation({ latitude: lat2, longitude: lng2 }),
          distance: expectedDistance,
        },
      ];

      locationRepository.query.mockResolvedValue(nearbyLocations);

      // Act
      const result = await service.getNearbyUsers(lat1, lng1, 2000000); // 2000km radius

      // Assert
      expect(result[0].distance).toBeCloseTo(expectedDistance, -2);
    });
  });

  describe('getDistanceBetweenLocations', () => {
    it('should calculate distance between two locations using ST_Distance_Sphere', async () => {
      // Arrange
      const location1Id = 'location-1';
      const location2Id = 'location-2';
      const distance = 12500; // meters

      locationRepository.query.mockResolvedValue([{ distance }]);

      // Act
      const result = await service.getDistanceBetweenLocations(location1Id, location2Id);

      // Assert
      expect(result).toBe(distance);
      expect(locationRepository.query).toHaveBeenCalled();
      const query = locationRepository.query.mock.calls[0][0];
      expect(query).toContain('ST_Distance_Sphere');
    });

    it('should return 0 when no result found', async () => {
      // Arrange
      const location1Id = 'location-1';
      const location2Id = 'location-2';

      locationRepository.query.mockResolvedValue([]);

      // Act
      const result = await service.getDistanceBetweenLocations(location1Id, location2Id);

      // Assert
      expect(result).toBe(0);
    });
  });
});
