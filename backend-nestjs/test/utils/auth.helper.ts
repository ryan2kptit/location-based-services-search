import { JwtService } from '@nestjs/jwt';
import { User } from '../../src/users/entities/user.entity';
import * as fs from 'fs';
import * as path from 'path';

export class AuthHelper {
  private jwtService: JwtService;
  private privateKey: string;
  private publicKey: string;

  constructor() {
    this.jwtService = new JwtService({});

    // Load test keys or use default
    try {
      this.privateKey = fs.readFileSync(
        path.resolve(process.cwd(), 'keys/private.key'),
        'utf8',
      );
      this.publicKey = fs.readFileSync(
        path.resolve(process.cwd(), 'keys/public.key'),
        'utf8',
      );
    } catch {
      // Use mock keys for testing
      this.privateKey = 'mock-private-key';
      this.publicKey = 'mock-public-key';
    }
  }

  generateAccessToken(user: User, expiresIn: string = '15m'): string {
    return this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      {
        algorithm: 'RS256',
        privateKey: this.privateKey,
        expiresIn,
      },
    );
  }

  generateRefreshToken(userId: string, tokenId: string, expiresIn: string = '7d'): string {
    return this.jwtService.sign(
      {
        sub: userId,
        tokenId,
      },
      {
        algorithm: 'RS256',
        privateKey: this.privateKey,
        expiresIn,
      },
    );
  }

  verifyToken(token: string): any {
    try {
      return this.jwtService.verify(token, {
        algorithms: ['RS256'],
        publicKey: this.publicKey,
      });
    } catch (error) {
      return null;
    }
  }

  decodeToken(token: string): any {
    return this.jwtService.decode(token);
  }

  generateExpiredToken(user: User): string {
    return this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      {
        algorithm: 'RS256',
        privateKey: this.privateKey,
        expiresIn: '-1h', // Already expired
      },
    );
  }

  createAuthHeader(token: string): { Authorization: string } {
    return {
      Authorization: `Bearer ${token}`,
    };
  }
}

export const mockJwtService = {
  sign: jest.fn(),
  verify: jest.fn(),
  decode: jest.fn(),
};

export const mockConfigService = {
  get: jest.fn((key: string) => {
    const config: Record<string, any> = {
      'jwt.accessTokenExpiry': '15m',
      'jwt.refreshTokenExpiry': '7d',
      'jwt.privateKeyPath': 'keys/private.key',
      'jwt.publicKeyPath': 'keys/public.key',
      DATABASE_HOST: 'localhost',
      DATABASE_PORT: 5432,
      DATABASE_USER: 'postgres',
      DATABASE_PASSWORD: 'postgres',
      DATABASE_NAME: 'test_db',
    };
    return config[key];
  }),
};
