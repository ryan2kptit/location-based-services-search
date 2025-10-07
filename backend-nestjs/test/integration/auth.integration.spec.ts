import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DatabaseHelper } from '../utils/database.helper';
import { TestDataFactory } from '../utils/test-data.factory';
import * as bcrypt from 'bcrypt';

describe('Auth Integration Tests', () => {
  let app: INestApplication;
  let dbHelper: DatabaseHelper;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    // Note: In a real integration test, you would set up a test database
    // For now, we'll demonstrate the test structure
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const registerDto = {
        email: `test-${Date.now()}@example.com`,
        password: 'Password123!',
        name: 'Test User',
        phone: '+84123456789',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.tokenType).toBe('Bearer');
      expect(response.body.user.email).toBe(registerDto.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should return 409 when email already exists', async () => {
      const registerDto = {
        email: 'duplicate@example.com',
        password: 'Password123!',
        name: 'Test User',
      };

      // Register first time
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      // Try to register again with same email
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(409);
    });

    it('should validate email format', async () => {
      const registerDto = {
        email: 'invalid-email',
        password: 'Password123!',
        name: 'Test User',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);
    });

    it('should validate password requirements', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: '123', // Too short
        name: 'Test User',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);
    });

    it('should require name field', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    const testUser = {
      email: `login-test-${Date.now()}@example.com`,
      password: 'Password123!',
      name: 'Login Test User',
    };

    beforeAll(async () => {
      // Register test user
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser);
    });

    it('should login with valid credentials', async () => {
      const loginDto = {
        email: testUser.email,
        password: testUser.password,
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe(testUser.email);
    });

    it('should return 401 for invalid email', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'Password123!',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);
    });

    it('should return 401 for invalid password', async () => {
      const loginDto = {
        email: testUser.email,
        password: 'WrongPassword123!',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);
    });

    it('should update last login timestamp', async () => {
      const loginDto = {
        email: testUser.email,
        password: testUser.password,
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200);

      expect(response.body.user.lastLoginAt).toBeDefined();
    });
  });

  describe('POST /auth/refresh', () => {
    let refreshToken: string;

    beforeAll(async () => {
      const registerDto = {
        email: `refresh-test-${Date.now()}@example.com`,
        password: 'Password123!',
        name: 'Refresh Test User',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      refreshToken = response.body.refreshToken;
    });

    it('should refresh access token with valid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.refreshToken).not.toBe(refreshToken); // New refresh token
    });

    it('should return 401 for invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
    });

    it('should return 401 for expired refresh token', async () => {
      // This would require creating an expired token
      // Implementation depends on your token generation logic
    });
  });

  describe('POST /auth/logout', () => {
    let accessToken: string;

    beforeEach(async () => {
      const registerDto = {
        email: `logout-test-${Date.now()}@example.com`,
        password: 'Password123!',
        name: 'Logout Test User',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      accessToken = response.body.accessToken;
    });

    it('should logout successfully with valid token', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .expect(401);
    });

    it('should revoke refresh tokens on logout', async () => {
      const registerDto = {
        email: `revoke-test-${Date.now()}@example.com`,
        password: 'Password123!',
        name: 'Revoke Test User',
      };

      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      const token = registerResponse.body.accessToken;
      const refreshTok = registerResponse.body.refreshToken;

      // Logout
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Try to use refresh token after logout
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: refreshTok })
        .expect(401);
    });
  });

  describe('Authentication Flow', () => {
    it('should complete full authentication flow', async () => {
      // 1. Register
      const registerDto = {
        email: `flow-test-${Date.now()}@example.com`,
        password: 'Password123!',
        name: 'Flow Test User',
      };

      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      const { accessToken: token1, refreshToken: refresh1 } = registerResponse.body;
      expect(token1).toBeDefined();
      expect(refresh1).toBeDefined();

      // 2. Access protected resource
      await request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      // 3. Refresh token
      const refreshResponse = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: refresh1 })
        .expect(200);

      const { accessToken: token2, refreshToken: refresh2 } = refreshResponse.body;
      expect(token2).toBeDefined();
      expect(token2).not.toBe(token1);

      // 4. Use new access token
      await request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      // 5. Logout
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      // 6. Verify tokens are revoked
      await request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', `Bearer ${token2}`)
        .expect(401);
    });
  });

  describe('Token Expiration', () => {
    it('should reject expired access token', async () => {
      // This would require mocking time or creating an expired token
      // Implementation depends on your JWT configuration
    });

    it('should reject expired refresh token', async () => {
      // This would require mocking time or creating an expired token
      // Implementation depends on your JWT configuration
    });
  });
});
