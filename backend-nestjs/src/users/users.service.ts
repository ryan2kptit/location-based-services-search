import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User } from './entities/user.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { IUsersService } from './interfaces/users-service.interface';

@Injectable()
export class UsersService implements IUsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(PasswordResetToken)
    private passwordResetTokenRepository: Repository<PasswordResetToken>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    Object.assign(user, updateUserDto);

    const updatedUser = await this.userRepository.save(user);

    // Invalidate JWT validation cache when user data changes
    // This ensures that any status or role changes are reflected immediately
    const cacheKey = `user:jwt-validation:${id}`;
    await this.cacheManager.del(cacheKey);
    console.log(`Invalidated JWT validation cache for user ${id}`);

    return updatedUser;
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.findOne(userId);

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    user.password = hashedPassword;
    await this.userRepository.save(user);

    // Invalidate JWT validation cache when password changes
    // This ensures security by forcing re-validation
    const cacheKey = `user:jwt-validation:${userId}`;
    await this.cacheManager.del(cacheKey);
    console.log(`Invalidated JWT validation cache for user ${userId} after password change`);
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<string> {
    const { email } = forgotPasswordDto;

    const user = await this.findByEmail(email);

    if (!user) {
      // Don't reveal if user exists or not
      return 'If your email is registered, you will receive a password reset link';
    }

    // Invalidate all previous tokens
    await this.passwordResetTokenRepository.update(
      { userId: user.id, isUsed: false },
      { isUsed: true, usedAt: new Date() },
    );

    // Generate reset token
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token valid for 1 hour

    // Save reset token
    const resetToken = this.passwordResetTokenRepository.create({
      userId: user.id,
      token,
      expiresAt,
    });

    await this.passwordResetTokenRepository.save(resetToken);

    // TODO: Send email with reset link
    // For now, return the token (in production, send via email)
    console.log(`Password reset token for ${email}: ${token}`);

    return 'If your email is registered, you will receive a password reset link';
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const { token, newPassword } = resetPasswordDto;

    // Find valid token
    const resetToken = await this.passwordResetTokenRepository.findOne({
      where: { token, isUsed: false },
      relations: ['user'],
    });

    if (!resetToken) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Check if token is expired
    if (resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Reset token has expired');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user password
    resetToken.user.password = hashedPassword;
    await this.userRepository.save(resetToken.user);

    // Mark token as used
    resetToken.isUsed = true;
    resetToken.usedAt = new Date();
    await this.passwordResetTokenRepository.save(resetToken);

    // Invalidate JWT validation cache when password is reset
    const cacheKey = `user:jwt-validation:${resetToken.user.id}`;
    await this.cacheManager.del(cacheKey);
    console.log(`Invalidated JWT validation cache for user ${resetToken.user.id} after password reset`);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);

    // Soft delete
    user.deletedAt = new Date();
    await this.userRepository.save(user);

    // Invalidate JWT validation cache when user is deleted
    const cacheKey = `user:jwt-validation:${id}`;
    await this.cacheManager.del(cacheKey);
    console.log(`Invalidated JWT validation cache for deleted user ${id}`);
  }
}
