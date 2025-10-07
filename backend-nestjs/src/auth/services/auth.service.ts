import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import * as bcrypt from 'bcrypt';
import { User, UserStatus } from '../../users/entities/user.entity';
import { RefreshToken } from '../../users/entities/refresh-token.entity';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { IAuthService } from '../interfaces/auth-service.interface';

@Injectable()
export class AuthService implements IAuthService {
  private privateKey: string;
  private publicKey: string;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    @InjectDataSource()
    private dataSource: DataSource,
    private jwtService: JwtService,
    private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.privateKey = this.configService.get<string>('jwt.privateKey') || '';
    this.publicKey = this.configService.get<string>('jwt.publicKey') || '';
  }

  async register(registerDto: RegisterDto, req?: any): Promise<AuthResponseDto> {
    const { email, password, firstName, lastName, phoneNumber } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Combine firstName and lastName to create name
    const name = `${firstName} ${lastName}`.trim();

    // Use transaction to ensure atomicity of user creation and token generation
    return await this.dataSource.transaction(async (entityManager) => {
      // Create user
      const user = entityManager.create(User, {
        email,
        password: hashedPassword,
        name,
        phone: phoneNumber || null,
        lastLoginAt: new Date(),
      });

      await entityManager.save(user);

      // Generate tokens within the same transaction
      return this.generateTokensWithManager(user, req, entityManager);
    });
  }

  async login(loginDto: LoginDto, req?: any): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Find user
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check user status
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User account is not active');
    }

    // Use transaction to ensure atomicity of last login update and token generation
    return await this.dataSource.transaction(async (entityManager) => {
      // Update last login
      user.lastLoginAt = new Date();
      await entityManager.save(user);

      // Generate tokens within the same transaction
      return this.generateTokensWithManager(user, req, entityManager);
    });
  }

  async refresh(
    userId: string,
    tokenId: string,
    req?: any,
  ): Promise<AuthResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Use transaction to ensure atomicity of token revocation and new token generation
    const result = await this.dataSource.transaction(async (entityManager) => {
      // Revoke old refresh token
      await entityManager.update(
        RefreshToken,
        { id: tokenId },
        { isRevoked: true, revokedAt: new Date() },
      );

      // Generate new tokens within the same transaction
      return this.generateTokensWithManager(user, req, entityManager);
    });

    // Invalidate refresh token validation cache after revoking the old token
    const cacheKey = `user:refresh-token-validation:${tokenId}`;
    await this.cacheManager.del(cacheKey);
    console.log(`Invalidated refresh token validation cache for token ${tokenId}`);

    return result;
  }

  async logout(userId: string, tokenId?: string): Promise<void> {
    if (tokenId) {
      // Revoke specific refresh token
      await this.refreshTokenRepository.update(
        { id: tokenId },
        { isRevoked: true, revokedAt: new Date() },
      );

      // Invalidate refresh token validation cache for specific token
      const cacheKey = `user:refresh-token-validation:${tokenId}`;
      await this.cacheManager.del(cacheKey);
      console.log(`Invalidated refresh token validation cache for token ${tokenId} on logout`);
    } else {
      // Revoke all user's refresh tokens
      const tokens = await this.refreshTokenRepository.find({
        where: { userId, isRevoked: false },
      });

      await this.refreshTokenRepository.update(
        { userId, isRevoked: false },
        { isRevoked: true, revokedAt: new Date() },
      );

      // Invalidate all refresh token caches for this user
      const cacheKeys = tokens.map(token => `user:refresh-token-validation:${token.id}`);
      await Promise.all(cacheKeys.map(key => this.cacheManager.del(key)));
      console.log(`Invalidated ${cacheKeys.length} refresh token validation caches for user ${userId} on logout`);
    }
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  private async generateTokens(
    user: User,
    req?: any,
  ): Promise<AuthResponseDto> {
    return this.generateTokensWithManager(user, req);
  }

  private async generateTokensWithManager(
    user: User,
    req?: any,
    entityManager?: any,
  ): Promise<AuthResponseDto> {
    const accessTokenExpiry = this.configService.get<string>(
      'jwt.accessTokenExpiry',
    );
    const refreshTokenExpiry = this.configService.get<string>(
      'jwt.refreshTokenExpiry',
    );

    // Generate access token
    const accessToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      {
        algorithm: 'RS256',
        privateKey: this.privateKey,
        expiresIn: accessTokenExpiry,
      },
    );

    // Generate a UUID for the refresh token record
    const { randomUUID } = await import('crypto');
    const tokenId = randomUUID();

    // Generate refresh token JWT
    const refreshToken = this.jwtService.sign(
      {
        sub: user.id,
        tokenId: tokenId,
      },
      {
        algorithm: 'RS256',
        privateKey: this.privateKey,
        expiresIn: refreshTokenExpiry,
      },
    );

    // Create and save refresh token record
    const manager = entityManager || this.refreshTokenRepository.manager;
    const refreshTokenRecord = manager.create(RefreshToken, {
      id: tokenId,
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      deviceInfo: req?.headers['user-agent'] ? { userAgent: req.headers['user-agent'] } : null,
      ipAddress: req?.ip || null,
    });

    await manager.save(refreshTokenRecord);

    // Remove sensitive data from user object
    const { password, ...userWithoutPassword } = user;

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 900, // 15 minutes in seconds
      user: userWithoutPassword,
    };
  }
}
