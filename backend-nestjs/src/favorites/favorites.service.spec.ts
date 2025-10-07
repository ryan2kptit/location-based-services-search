import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { FavoritesService } from './favorites.service';
import { Favorite } from './entities/favorite.entity';
import { Service } from '../services/entities/service.entity';
import { TestDataFactory } from '../../test/utils/test-data.factory';
import { createMockRepository, resetMocks } from '../../test/utils/database.helper';

describe('FavoritesService', () => {
  let service: FavoritesService;
  let favoriteRepository: ReturnType<typeof createMockRepository>;
  let serviceRepository: ReturnType<typeof createMockRepository>;
  let mockDataSource: any;

  beforeEach(async () => {
    favoriteRepository = createMockRepository();
    serviceRepository = createMockRepository();

    // Mock DataSource with transaction support
    mockDataSource = {
      transaction: jest.fn((callback: any) => {
        const mockEntityManager = {
          create: jest.fn((entity, data) => data),
          save: jest.fn().mockResolvedValue({}),
          increment: jest.fn().mockResolvedValue({ affected: 1 }),
          decrement: jest.fn().mockResolvedValue({ affected: 1 }),
          remove: jest.fn().mockResolvedValue({}),
        };
        return callback(mockEntityManager);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoritesService,
        {
          provide: getRepositoryToken(Favorite),
          useValue: favoriteRepository,
        },
        {
          provide: getRepositoryToken(Service),
          useValue: serviceRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<FavoritesService>(FavoritesService);
  });

  afterEach(() => {
    resetMocks(favoriteRepository, serviceRepository);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should successfully add service to favorites', async () => {
      // Arrange
      const userId = 'user-id';
      const testService = TestDataFactory.createService();
      const createFavoriteDto = {
        serviceId: testService.id,
      };

      const mockFavorite = { userId, serviceId: testService.id };

      serviceRepository.findOne.mockResolvedValue(testService);
      favoriteRepository.findOne.mockResolvedValue(null);

      mockDataSource.transaction.mockImplementation((callback: any) => {
        const mockEntityManager = {
          create: jest.fn().mockReturnValue(mockFavorite),
          save: jest.fn().mockResolvedValue(mockFavorite),
          increment: jest.fn().mockResolvedValue({ affected: 1 }),
        };
        return callback(mockEntityManager);
      });

      // Act
      const result = await service.create(userId, createFavoriteDto);

      // Assert
      expect(result.userId).toBe(userId);
      expect(result.serviceId).toBe(testService.id);
      expect(mockDataSource.transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException when service does not exist', async () => {
      // Arrange
      const userId = 'user-id';
      const createFavoriteDto = {
        serviceId: 'nonexistent-service-id',
      };

      serviceRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(userId, createFavoriteDto)).rejects.toThrow(NotFoundException);
      await expect(service.create(userId, createFavoriteDto)).rejects.toThrow('Service not found');
    });

    it('should throw ConflictException when service is already favorited', async () => {
      // Arrange
      const userId = 'user-id';
      const testService = TestDataFactory.createService();
      const existingFavorite = TestDataFactory.createFavorite({
        userId,
        serviceId: testService.id,
      });
      const createFavoriteDto = {
        serviceId: testService.id,
      };

      serviceRepository.findOne.mockResolvedValue(testService);
      favoriteRepository.findOne.mockResolvedValue(existingFavorite);

      // Act & Assert
      await expect(service.create(userId, createFavoriteDto)).rejects.toThrow(ConflictException);
      await expect(service.create(userId, createFavoriteDto)).rejects.toThrow(
        'Service is already in favorites',
      );
    });

    it('should increment favorite count on service', async () => {
      // Arrange
      const userId = 'user-id';
      const testService = TestDataFactory.createService();
      const createFavoriteDto = {
        serviceId: testService.id,
      };

      const mockIncrement = jest.fn().mockResolvedValue({ affected: 1 });

      serviceRepository.findOne.mockResolvedValue(testService);
      favoriteRepository.findOne.mockResolvedValue(null);

      mockDataSource.transaction.mockImplementation((callback: any) => {
        const mockEntityManager = {
          create: jest.fn().mockReturnValue({}),
          save: jest.fn().mockResolvedValue({}),
          increment: mockIncrement,
        };
        return callback(mockEntityManager);
      });

      // Act
      await service.create(userId, createFavoriteDto);

      // Assert
      expect(mockIncrement).toHaveBeenCalledWith(
        Service,
        { id: testService.id },
        'favoriteCount',
        1,
      );
    });

    it('should create favorite without optional fields', async () => {
      // Arrange
      const userId = 'user-id';
      const testService = TestDataFactory.createService();
      const createFavoriteDto = {
        serviceId: testService.id,
      };

      const mockFavorite = { userId, serviceId: testService.id };

      serviceRepository.findOne.mockResolvedValue(testService);
      favoriteRepository.findOne.mockResolvedValue(null);

      mockDataSource.transaction.mockImplementation((callback: any) => {
        const mockEntityManager = {
          create: jest.fn().mockReturnValue(mockFavorite),
          save: jest.fn().mockResolvedValue(mockFavorite),
          increment: jest.fn().mockResolvedValue({ affected: 1 }),
        };
        return callback(mockEntityManager);
      });

      // Act
      const result = await service.create(userId, createFavoriteDto);

      // Assert
      expect(result.serviceId).toBe(testService.id);
      expect(mockDataSource.transaction).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all favorites for a user', async () => {
      // Arrange
      const userId = 'user-id';
      const favorites = [
        TestDataFactory.createFavorite({ userId }),
        TestDataFactory.createFavorite({ userId }),
      ];

      favoriteRepository.find.mockResolvedValue(favorites);

      // Act
      const result = await service.findAll(userId);

      // Assert
      expect(result).toEqual(favorites);
      expect(favoriteRepository.find).toHaveBeenCalledWith({
        where: { userId },
        relations: ['service', 'service.serviceType'],
        order: { createdAt: 'DESC' },
      });
    });

    it('should return empty array when user has no favorites', async () => {
      // Arrange
      const userId = 'user-id';
      favoriteRepository.find.mockResolvedValue([]);

      // Act
      const result = await service.findAll(userId);

      // Assert
      expect(result).toEqual([]);
    });

    it('should order favorites by creation date descending', async () => {
      // Arrange
      const userId = 'user-id';
      favoriteRepository.find.mockResolvedValue([]);

      // Act
      await service.findAll(userId);

      // Assert
      expect(favoriteRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { createdAt: 'DESC' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a specific favorite', async () => {
      // Arrange
      const userId = 'user-id';
      const favoriteId = 'favorite-id';
      const favorite = TestDataFactory.createFavorite({ id: favoriteId, userId });

      favoriteRepository.findOne.mockResolvedValue(favorite);

      // Act
      const result = await service.findOne(userId, favoriteId);

      // Assert
      expect(result).toEqual(favorite);
      expect(favoriteRepository.findOne).toHaveBeenCalledWith({
        where: { id: favoriteId, userId },
        relations: ['service', 'service.serviceType'],
      });
    });

    it('should throw NotFoundException when favorite not found', async () => {
      // Arrange
      const userId = 'user-id';
      const favoriteId = 'nonexistent-id';

      favoriteRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(userId, favoriteId)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(userId, favoriteId)).rejects.toThrow('Favorite not found');
    });
  });

  describe('remove', () => {
    it('should successfully remove favorite', async () => {
      // Arrange
      const userId = 'user-id';
      const favoriteId = 'favorite-id';
      const favorite = TestDataFactory.createFavorite({ id: favoriteId, userId });

      favoriteRepository.findOne.mockResolvedValue(favorite);

      const mockRemove = jest.fn().mockResolvedValue(favorite);
      mockDataSource.transaction.mockImplementation((callback: any) => {
        const mockEntityManager = {
          decrement: jest.fn().mockResolvedValue({ affected: 1 }),
          remove: mockRemove,
        };
        return callback(mockEntityManager);
      });

      // Act
      await service.remove(userId, favoriteId);

      // Assert
      expect(mockRemove).toHaveBeenCalledWith(favorite);
      expect(mockDataSource.transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException when favorite not found', async () => {
      // Arrange
      const userId = 'user-id';
      const favoriteId = 'nonexistent-id';

      favoriteRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove(userId, favoriteId)).rejects.toThrow(NotFoundException);
    });

    it('should decrement favorite count on service', async () => {
      // Arrange
      const userId = 'user-id';
      const favoriteId = 'favorite-id';
      const serviceId = 'service-id';
      const favorite = TestDataFactory.createFavorite({
        id: favoriteId,
        userId,
        serviceId,
      });

      favoriteRepository.findOne.mockResolvedValue(favorite);

      const mockDecrement = jest.fn().mockResolvedValue({ affected: 1 });
      mockDataSource.transaction.mockImplementation((callback: any) => {
        const mockEntityManager = {
          decrement: mockDecrement,
          remove: jest.fn().mockResolvedValue(favorite),
        };
        return callback(mockEntityManager);
      });

      // Act
      await service.remove(userId, favoriteId);

      // Assert
      expect(mockDecrement).toHaveBeenCalledWith(
        Service,
        { id: serviceId },
        'favoriteCount',
        1,
      );
    });
  });

  describe('isFavorite', () => {
    it('should return true when service is favorited', async () => {
      // Arrange
      const userId = 'user-id';
      const serviceId = 'service-id';

      favoriteRepository.count.mockResolvedValue(1);

      // Act
      const result = await service.isFavorite(userId, serviceId);

      // Assert
      expect(result).toBe(true);
      expect(favoriteRepository.count).toHaveBeenCalledWith({
        where: { userId, serviceId },
      });
    });

    it('should return false when service is not favorited', async () => {
      // Arrange
      const userId = 'user-id';
      const serviceId = 'service-id';

      favoriteRepository.count.mockResolvedValue(0);

      // Act
      const result = await service.isFavorite(userId, serviceId);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getFavoritesByServiceType', () => {
    it('should return favorites filtered by service type', async () => {
      // Arrange
      const userId = 'user-id';
      const serviceTypeId = 'type-id';
      const queryBuilder: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        into: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        execute: jest.fn(),
        getOne: jest.fn(),
        getManyAndCount: jest.fn(),
        getCount: jest.fn(),
        getMany: jest.fn().mockResolvedValue([
          TestDataFactory.createFavorite({ userId }),
        ]),
      };

      favoriteRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      // Act
      const result = await service.getFavoritesByServiceType(userId, serviceTypeId);

      // Assert
      expect(result).toHaveLength(1);
      expect(queryBuilder.where).toHaveBeenCalledWith('favorite.userId = :userId', { userId });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'service.serviceTypeId = :serviceTypeId',
        { serviceTypeId },
      );
    });

    it('should join service and service type relations', async () => {
      // Arrange
      const userId = 'user-id';
      const serviceTypeId = 'type-id';
      const queryBuilder: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        into: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        execute: jest.fn(),
        getOne: jest.fn(),
        getManyAndCount: jest.fn(),
        getCount: jest.fn(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      favoriteRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      // Act
      await service.getFavoritesByServiceType(userId, serviceTypeId);

      // Assert
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('favorite.service', 'service');
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('service.serviceType', 'serviceType');
    });

    it('should order by creation date descending', async () => {
      // Arrange
      const userId = 'user-id';
      const serviceTypeId = 'type-id';
      const queryBuilder: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        into: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        execute: jest.fn(),
        getOne: jest.fn(),
        getManyAndCount: jest.fn(),
        getCount: jest.fn(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      favoriteRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      // Act
      await service.getFavoritesByServiceType(userId, serviceTypeId);

      // Assert
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('favorite.createdAt', 'DESC');
    });
  });
});
