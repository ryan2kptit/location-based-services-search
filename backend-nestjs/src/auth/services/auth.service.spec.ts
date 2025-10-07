// Mock typeorm entirely FIRST to prevent path-scurry error
jest.mock('typeorm', () => {
  class MockRepository {}
  return {
    DataSource: jest.fn(),
    Entity: () => jest.fn(),
    PrimaryGeneratedColumn: () => jest.fn(),
    Column: () => jest.fn(),
    CreateDateColumn: () => jest.fn(),
    UpdateDateColumn: () => jest.fn(),
    ManyToOne: () => jest.fn(),
    OneToMany: () => jest.fn(),
    JoinColumn: () => jest.fn(),
    Index: () => jest.fn(),
    Unique: () => jest.fn(),
    Repository: MockRepository,
    EntitySchema: jest.fn(),
    In: jest.fn(),
    Not: jest.fn(),
    IsNull: jest.fn(),
    LessThan: jest.fn(),
    MoreThan: jest.fn(),
  };
});

// Mock bcrypt module
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

const bcrypt = require('bcrypt');

// Mock fs module
jest.mock('fs', () => ({
  readFileSync: jest.fn(() => 'mock-key'),
  existsSync: jest.fn(() => true),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { AuthService } from './auth.service';
import { User, UserStatus } from '../../users/entities/user.entity';
import { RefreshToken } from '../../users/entities/refresh-token.entity';
import { TestDataFactory } from '../../../test/utils/test-data.factory';
import { createMockRepository, resetMocks } from '../../../test/utils/database.helper';
import { mockJwtService, mockConfigService } from '../../../test/utils/auth.helper';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: ReturnType<typeof createMockRepository>;
  let refreshTokenRepository: ReturnType<typeof createMockRepository>;
  let jwtService: typeof mockJwtService;
  let configService: typeof mockConfigService;
  let mockCacheManager: any;
  let mockDataSource: any;

  beforeEach(async () => {
    userRepository = createMockRepository();
    refreshTokenRepository = createMockRepository();

    // Mock cache manager
    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      reset: jest.fn(),
    };

    // Mock DataSource with transaction support
    mockDataSource = {
      transaction: jest.fn((callback: any) => {
        const mockEntityManager = {
          create: jest.fn((entity, data) => data),
          save: jest.fn((data) => Promise.resolve({ id: 'test-id', ...data })),
          findOne: jest.fn(),
        };
        return callback(mockEntityManager);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: refreshTokenRepository,
        },
        {
          provide: 'DataSource',
          useValue: mockDataSource,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    resetMocks(userRepository, refreshTokenRepository, jwtService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      // Arrange
      const registerDto = {
        email: 'newuser@example.com',
        password: 'Password123!',
        name: 'New User',
        phone: '+84123456789',
      };

      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue(TestDataFactory.createUser({ email: registerDto.email }));
      userRepository.save.mockResolvedValue(TestDataFactory.createUser({ email: registerDto.email }));

      refreshTokenRepository.create.mockReturnValue(TestDataFactory.createRefreshToken());
      refreshTokenRepository.save.mockResolvedValue(TestDataFactory.createRefreshToken());

      jwtService.sign.mockReturnValue('mock-token');

      // Act
      const result = await service.register(registerDto);

      // Assert
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.tokenType).toBe('Bearer');
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { email: registerDto.email } });
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should hash password correctly', async () => {
      // Arrange
      const registerDto = {
        email: 'test@example.com',
        password: 'PlainPassword123!',
        name: 'Test User',
      };

      const hashSpy = jest.spyOn(bcrypt, 'hash');
      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockImplementation((data) => data as User);
      userRepository.save.mockImplementation((user) => Promise.resolve(user));
      refreshTokenRepository.create.mockReturnValue(TestDataFactory.createRefreshToken());
      refreshTokenRepository.save.mockResolvedValue(TestDataFactory.createRefreshToken());
      jwtService.sign.mockReturnValue('mock-token');

      // Act
      await service.register(registerDto);

      // Assert
      expect(hashSpy).toHaveBeenCalledWith(registerDto.password, 12);
    });

    it('should throw ConflictException when user already exists', async () => {
      // Arrange
      const registerDto = {
        email: 'existing@example.com',
        password: 'Password123!',
        name: 'Existing User',
      };

      userRepository.findOne.mockResolvedValue(TestDataFactory.createUser({ email: registerDto.email }));

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      await expect(service.register(registerDto)).rejects.toThrow('User with this email already exists');
    });

    it('should generate both access and refresh tokens', async () => {
      // Arrange
      const registerDto = {
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
      };

      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue(TestDataFactory.createUser());
      userRepository.save.mockResolvedValue(TestDataFactory.createUser());
      refreshTokenRepository.create.mockReturnValue(TestDataFactory.createRefreshToken());
      refreshTokenRepository.save.mockResolvedValue(TestDataFactory.createRefreshToken());

      const accessToken = 'access-token';
      const refreshToken = 'refresh-token';
      jwtService.sign
        .mockReturnValueOnce(accessToken)
        .mockReturnValueOnce(refreshToken);

      // Act
      const result = await service.register(registerDto);

      // Assert
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(result.accessToken).toBe(accessToken);
      expect(result.refreshToken).toBe(refreshToken);
    });
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      // Arrange
      const loginDto = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const hashedPassword = await bcrypt.hash(loginDto.password, 12);
      const user = TestDataFactory.createUser({
        email: loginDto.email,
        password: hashedPassword,
      });

      userRepository.findOne.mockResolvedValue(user);
      userRepository.save.mockResolvedValue(user);
      refreshTokenRepository.create.mockReturnValue(TestDataFactory.createRefreshToken());
      refreshTokenRepository.save.mockResolvedValue(TestDataFactory.createRefreshToken());
      jwtService.sign.mockReturnValue('mock-token');

      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(loginDto.email);
      expect(userRepository.save).toHaveBeenCalled(); // Updates lastLoginAt
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      // Arrange
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'Password123!',
      };

      userRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Invalid credentials');
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      // Arrange
      const loginDto = {
        email: 'test@example.com',
        password: 'WrongPassword123!',
      };

      const user = TestDataFactory.createUser({ email: loginDto.email });
      userRepository.findOne.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Invalid credentials');
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      // Arrange
      const loginDto = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const hashedPassword = await bcrypt.hash(loginDto.password, 12);
      const user = TestDataFactory.createUser({
        email: loginDto.email,
        password: hashedPassword,
        status: UserStatus.INACTIVE,
      });

      userRepository.findOne.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('User account is not active');
    });

    it('should update last login timestamp', async () => {
      // Arrange
      const loginDto = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const hashedPassword = await bcrypt.hash(loginDto.password, 12);
      const user = TestDataFactory.createUser({
        email: loginDto.email,
        password: hashedPassword,
      });

      userRepository.findOne.mockResolvedValue(user);
      userRepository.save.mockResolvedValue(user);
      refreshTokenRepository.create.mockReturnValue(TestDataFactory.createRefreshToken());
      refreshTokenRepository.save.mockResolvedValue(TestDataFactory.createRefreshToken());
      jwtService.sign.mockReturnValue('mock-token');

      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));

      // Act
      await service.login(loginDto);

      // Assert
      expect(userRepository.save).toHaveBeenCalled();
      const savedUser = userRepository.save.mock.calls[0][0];
      expect(savedUser.lastLoginAt).toBeInstanceOf(Date);
    });
  });

  describe('refresh', () => {
    it('should successfully refresh tokens', async () => {
      // Arrange
      const userId = 'user-id';
      const tokenId = 'token-id';
      const user = TestDataFactory.createUser({ id: userId });

      userRepository.findOne.mockResolvedValue(user);
      refreshTokenRepository.update.mockResolvedValue({ affected: 1 });
      refreshTokenRepository.create.mockReturnValue(TestDataFactory.createRefreshToken());
      refreshTokenRepository.save.mockResolvedValue(TestDataFactory.createRefreshToken());
      jwtService.sign.mockReturnValue('new-token');

      // Act
      const result = await service.refresh(userId, tokenId);

      // Assert
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(refreshTokenRepository.update).toHaveBeenCalledWith(
        { id: tokenId },
        { isRevoked: true, revokedAt: expect.any(Date) },
      );
    });

    it('should throw UnauthorizedException when user not found', async () => {
      // Arrange
      const userId = 'nonexistent-user';
      const tokenId = 'token-id';

      userRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.refresh(userId, tokenId)).rejects.toThrow(UnauthorizedException);
      await expect(service.refresh(userId, tokenId)).rejects.toThrow('User not found');
    });

    it('should revoke old refresh token before generating new one', async () => {
      // Arrange
      const userId = 'user-id';
      const tokenId = 'old-token-id';
      const user = TestDataFactory.createUser({ id: userId });

      userRepository.findOne.mockResolvedValue(user);
      refreshTokenRepository.update.mockResolvedValue({ affected: 1 });
      refreshTokenRepository.create.mockReturnValue(TestDataFactory.createRefreshToken());
      refreshTokenRepository.save.mockResolvedValue(TestDataFactory.createRefreshToken());
      jwtService.sign.mockReturnValue('new-token');

      // Act
      await service.refresh(userId, tokenId);

      // Assert
      expect(refreshTokenRepository.update).toHaveBeenCalledWith(
        { id: tokenId },
        { isRevoked: true, revokedAt: expect.any(Date) },
      );
    });
  });

  describe('logout', () => {
    it('should revoke specific refresh token when tokenId provided', async () => {
      // Arrange
      const userId = 'user-id';
      const tokenId = 'token-id';

      refreshTokenRepository.update.mockResolvedValue({ affected: 1 });

      // Act
      await service.logout(userId, tokenId);

      // Assert
      expect(refreshTokenRepository.update).toHaveBeenCalledWith(
        { id: tokenId },
        { isRevoked: true, revokedAt: expect.any(Date) },
      );
    });

    it('should revoke all user tokens when tokenId not provided', async () => {
      // Arrange
      const userId = 'user-id';

      refreshTokenRepository.update.mockResolvedValue({ affected: 3 });

      // Act
      await service.logout(userId);

      // Assert
      expect(refreshTokenRepository.update).toHaveBeenCalledWith(
        { userId, isRevoked: false },
        { isRevoked: true, revokedAt: expect.any(Date) },
      );
    });
  });

  describe('validateUser', () => {
    it('should return user for valid credentials', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'Password123!';
      const hashedPassword = await bcrypt.hash(password, 12);
      const user = TestDataFactory.createUser({ email, password: hashedPassword });

      userRepository.findOne.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));

      // Act
      const result = await service.validateUser(email, password);

      // Assert
      expect(result).toBeDefined();
      expect(result?.email).toBe(email);
    });

    it('should return null for invalid email', async () => {
      // Arrange
      const email = 'nonexistent@example.com';
      const password = 'Password123!';

      userRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.validateUser(email, password);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null for invalid password', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'WrongPassword';
      const user = TestDataFactory.createUser({ email });

      userRepository.findOne.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

      // Act
      const result = await service.validateUser(email, password);

      // Assert
      expect(result).toBeNull();
    });
  });
});
