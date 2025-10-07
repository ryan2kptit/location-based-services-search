import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { TestDataFactory } from '../../test/utils/test-data.factory';
import { createMockRepository, resetMocks } from '../../test/utils/database.helper';

// Mock bcrypt at module level to avoid spy conflicts
jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: ReturnType<typeof createMockRepository>;
  let passwordResetTokenRepository: ReturnType<typeof createMockRepository>;
  let mockCacheManager: any;

  beforeEach(async () => {
    userRepository = createMockRepository();
    passwordResetTokenRepository = createMockRepository();

    // Mock cache manager
    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      reset: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: getRepositoryToken(PasswordResetToken),
          useValue: passwordResetTokenRepository,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    resetMocks(userRepository, passwordResetTokenRepository);
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('should return a user when found', async () => {
      // Arrange
      const user = TestDataFactory.createUser();
      userRepository.findOne.mockResolvedValue(user);

      // Act
      const result = await service.findOne(user.id);

      // Assert
      expect(result).toEqual(user);
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: user.id } });
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne('nonexistent-id')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('nonexistent-id')).rejects.toThrow('User not found');
    });
  });

  describe('findByEmail', () => {
    it('should return a user when found by email', async () => {
      // Arrange
      const user = TestDataFactory.createUser();
      userRepository.findOne.mockResolvedValue(user);

      // Act
      const result = await service.findByEmail(user.email);

      // Assert
      expect(result).toEqual(user);
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { email: user.email } });
    });

    it('should return null when user not found', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.findByEmail('nonexistent@example.com');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should successfully update user profile', async () => {
      // Arrange
      const user = TestDataFactory.createUser();
      const updateDto = {
        name: 'Updated Name',
        phone: '+84987654321',
      };

      userRepository.findOne.mockResolvedValue(user);
      userRepository.save.mockResolvedValue({ ...user, ...updateDto });

      // Act
      const result = await service.update(user.id, updateDto);

      // Assert
      expect(result.name).toBe(updateDto.name);
      expect(result.phone).toBe(updateDto.phone);
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.update('nonexistent-id', { name: 'New Name' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('changePassword', () => {
    it('should successfully change password with valid current password', async () => {
      // Arrange
      const user = TestDataFactory.createUser();
      const changePasswordDto = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
      };

      userRepository.findOne.mockResolvedValue(user);
      userRepository.save.mockResolvedValue(user);

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      // Act
      await service.changePassword(user.id, changePasswordDto);

      // Assert
      // Note: user.password from test factory is already hashed ($2b$12$hashedPassword)
      expect(bcrypt.compare).toHaveBeenCalledWith(
        changePasswordDto.currentPassword,
        '$2b$12$hashedPassword'
      );
      expect(bcrypt.hash).toHaveBeenCalledWith(changePasswordDto.newPassword, 12);
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when current password is incorrect', async () => {
      // Arrange
      const user = TestDataFactory.createUser();
      const changePasswordDto = {
        currentPassword: 'WrongPassword',
        newPassword: 'NewPassword123!',
      };

      userRepository.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(service.changePassword(user.id, changePasswordDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.changePassword(user.id, changePasswordDto)).rejects.toThrow(
        'Current password is incorrect',
      );
    });

    it('should hash new password with bcrypt', async () => {
      // Arrange
      const user = TestDataFactory.createUser();
      const changePasswordDto = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
      };

      userRepository.findOne.mockResolvedValue(user);
      userRepository.save.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      // Act
      await service.changePassword(user.id, changePasswordDto);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith(changePasswordDto.newPassword, 12);
    });
  });

  describe('forgotPassword', () => {
    it('should generate and save reset token for existing user', async () => {
      // Arrange
      const user = TestDataFactory.createUser();
      const forgotPasswordDto = { email: user.email };

      userRepository.findOne.mockResolvedValue(user);
      passwordResetTokenRepository.update.mockResolvedValue({ affected: 0 });
      passwordResetTokenRepository.create.mockReturnValue(TestDataFactory.createPasswordResetToken());
      passwordResetTokenRepository.save.mockResolvedValue(TestDataFactory.createPasswordResetToken());

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      const result = await service.forgotPassword(forgotPasswordDto);

      // Assert
      expect(result).toBe('If your email is registered, you will receive a password reset link');
      expect(passwordResetTokenRepository.update).toHaveBeenCalled(); // Invalidate old tokens
      expect(passwordResetTokenRepository.save).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled(); // Log token (in production, send email)

      consoleSpy.mockRestore();
    });

    it('should not reveal if user does not exist', async () => {
      // Arrange
      const forgotPasswordDto = { email: 'nonexistent@example.com' };
      userRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.forgotPassword(forgotPasswordDto);

      // Assert
      expect(result).toBe('If your email is registered, you will receive a password reset link');
      expect(passwordResetTokenRepository.save).not.toHaveBeenCalled();
    });

    it('should invalidate all previous reset tokens', async () => {
      // Arrange
      const user = TestDataFactory.createUser();
      const forgotPasswordDto = { email: user.email };

      userRepository.findOne.mockResolvedValue(user);
      passwordResetTokenRepository.update.mockResolvedValue({ affected: 2 });
      passwordResetTokenRepository.create.mockReturnValue(TestDataFactory.createPasswordResetToken());
      passwordResetTokenRepository.save.mockResolvedValue(TestDataFactory.createPasswordResetToken());

      jest.spyOn(console, 'log').mockImplementation();

      // Act
      await service.forgotPassword(forgotPasswordDto);

      // Assert
      expect(passwordResetTokenRepository.update).toHaveBeenCalledWith(
        { userId: user.id, isUsed: false },
        { isUsed: true, usedAt: expect.any(Date) },
      );
    });

    it('should set token expiration to 1 hour', async () => {
      // Arrange
      const user = TestDataFactory.createUser();
      const forgotPasswordDto = { email: user.email };

      userRepository.findOne.mockResolvedValue(user);
      passwordResetTokenRepository.update.mockResolvedValue({ affected: 0 });
      passwordResetTokenRepository.create.mockImplementation((data) => data);
      passwordResetTokenRepository.save.mockImplementation((data) => Promise.resolve(data));

      jest.spyOn(console, 'log').mockImplementation();

      // Act
      await service.forgotPassword(forgotPasswordDto);

      // Assert
      const createCall = passwordResetTokenRepository.create.mock.calls[0][0];
      const expiresAt = createCall.expiresAt;
      const expectedExpiry = new Date(Date.now() + 60 * 60 * 1000);
      expect(Math.abs(expiresAt.getTime() - expectedExpiry.getTime())).toBeLessThan(1000);
    });
  });

  describe('resetPassword', () => {
    it('should successfully reset password with valid token', async () => {
      // Arrange
      const user = TestDataFactory.createUser();
      const resetToken = TestDataFactory.createPasswordResetToken({
        userId: user.id,
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        isUsed: false,
      });
      resetToken.user = user;

      const resetPasswordDto = {
        token: 'valid-token',
        newPassword: 'NewPassword123!',
      };

      passwordResetTokenRepository.findOne.mockResolvedValue(resetToken);
      passwordResetTokenRepository.save.mockResolvedValue(resetToken);
      userRepository.save.mockResolvedValue(user);

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      // Act
      await service.resetPassword(resetPasswordDto);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith(resetPasswordDto.newPassword, 12);
      expect(userRepository.save).toHaveBeenCalled();
      expect(passwordResetTokenRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid token', async () => {
      // Arrange
      const resetPasswordDto = {
        token: 'invalid-token',
        newPassword: 'NewPassword123!',
      };

      passwordResetTokenRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(BadRequestException);
      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(
        'Invalid or expired reset token',
      );
    });

    it('should throw BadRequestException for expired token', async () => {
      // Arrange
      const resetToken = TestDataFactory.createPasswordResetToken({
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 1000), // Expired
        isUsed: false,
      });

      const resetPasswordDto = {
        token: 'expired-token',
        newPassword: 'NewPassword123!',
      };

      passwordResetTokenRepository.findOne.mockResolvedValue(resetToken);

      // Act & Assert
      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(BadRequestException);
      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(
        'Reset token has expired',
      );
    });

    it('should mark token as used after password reset', async () => {
      // Arrange
      const user = TestDataFactory.createUser();
      const resetToken = TestDataFactory.createPasswordResetToken({
        userId: user.id,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        isUsed: false,
      });
      resetToken.user = user;

      const resetPasswordDto = {
        token: resetToken.token,
        newPassword: 'NewPassword123!',
      };

      passwordResetTokenRepository.findOne.mockResolvedValue(resetToken);
      passwordResetTokenRepository.save.mockImplementation((data) => Promise.resolve(data));
      userRepository.save.mockResolvedValue(user);

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

      // Act
      await service.resetPassword(resetPasswordDto);

      // Assert
      const savedToken = passwordResetTokenRepository.save.mock.calls[0][0];
      expect(savedToken.isUsed).toBe(true);
      expect(savedToken.usedAt).toBeInstanceOf(Date);
    });
  });

  describe('remove', () => {
    it('should soft delete user', async () => {
      // Arrange
      const user = TestDataFactory.createUser();
      userRepository.findOne.mockResolvedValue(user);
      userRepository.save.mockImplementation((data) => Promise.resolve(data));

      // Act
      await service.remove(user.id);

      // Assert
      const savedUser = userRepository.save.mock.calls[0][0];
      expect(savedUser.deletedAt).toBeInstanceOf(Date);
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });
});
