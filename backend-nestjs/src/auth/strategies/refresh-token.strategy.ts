import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { RefreshToken } from '../../users/entities/refresh-token.entity';

export interface RefreshTokenPayload {
  sub: string;
  tokenId: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    const publicKey = configService.get<string>('jwt.publicKey') || '';

    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: publicKey,
      algorithms: ['RS256'],
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: RefreshTokenPayload) {
    const refreshTokenString = req.body.refreshToken;
    const { tokenId } = payload;
    const cacheKey = `user:refresh-token-validation:${tokenId}`;

    // Check cache first
    const cachedData = await this.cacheManager.get<any>(cacheKey);
    if (cachedData) {
      console.log(`Refresh token validation cache hit for token ${tokenId}`);

      // Verify token string still matches (security check)
      if (cachedData.token !== refreshTokenString) {
        throw new UnauthorizedException('Token mismatch');
      }

      return {
        userId: payload.sub,
        tokenId: tokenId,
        user: cachedData.user,
      };
    }

    console.log(`Refresh token validation cache miss for token ${tokenId}`);

    // Cache miss - query database
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { id: tokenId },
      relations: ['user'],
    });

    if (!refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (refreshToken.isRevoked) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (refreshToken.token !== refreshTokenString) {
      throw new UnauthorizedException('Token mismatch');
    }

    // Cache refresh token data for 15 minutes (900 seconds)
    const dataToCache = {
      token: refreshToken.token,
      isRevoked: refreshToken.isRevoked,
      user: {
        id: refreshToken.user.id,
        email: refreshToken.user.email,
        name: refreshToken.user.name,
        role: refreshToken.user.role,
        status: refreshToken.user.status,
      },
    };

    await this.cacheManager.set(cacheKey, dataToCache, 900);

    return {
      userId: payload.sub,
      tokenId: tokenId,
      user: refreshToken.user,
    };
  }
}
