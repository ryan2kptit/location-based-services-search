import { registerAs } from '@nestjs/config';
import { readFileSync } from 'fs';
import { join } from 'path';

export default registerAs('jwt', () => ({
  algorithm: process.env.JWT_ALGORITHM || 'RS256',
  accessTokenExpiry: process.env.JWT_ACCESS_TOKEN_EXPIRY || '1h',
  refreshTokenExpiry: process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d',
  privateKey: readFileSync(
    join(process.cwd(), process.env.JWT_PRIVATE_KEY_PATH || './keys/jwt-private.pem'),
    'utf8',
  ),
  publicKey: readFileSync(
    join(process.cwd(), process.env.JWT_PUBLIC_KEY_PATH || './keys/jwt-public.pem'),
    'utf8',
  ),
}));
