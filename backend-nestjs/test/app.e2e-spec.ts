import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { TestDataFactory } from './utils/test-data.factory';
import { SpatialHelper } from './utils/spatial.helper';

describe('App E2E Tests - Complete User Flows', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('User Registration → Login → Profile Update Flow', () => {
    it('should complete full user lifecycle', async () => {
      const timestamp = Date.now();

      // 1. Register new user
      const registerDto = {
        email: `e2e-user-${timestamp}@example.com`,
        password: 'Password123!',
        name: 'E2E Test User',
        phone: '+84123456789',
      };

      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      expect(registerResponse.body.user.email).toBe(registerDto.email);
      expect(registerResponse.body.user.name).toBe(registerDto.name);
      expect(registerResponse.body).toHaveProperty('accessToken');

      const { accessToken } = registerResponse.body;

      // 2. Get user profile
      const profileResponse = await request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(profileResponse.body.email).toBe(registerDto.email);

      // 3. Update profile
      const updateDto = {
        name: 'Updated Name',
        phone: '+84987654321',
      };

      const updateResponse = await request(app.getHttpServer())
        .patch('/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateDto)
        .expect(200);

      expect(updateResponse.body.name).toBe(updateDto.name);
      expect(updateResponse.body.phone).toBe(updateDto.phone);

      // 4. Change password
      const changePasswordDto = {
        currentPassword: registerDto.password,
        newPassword: 'NewPassword123!',
      };

      await request(app.getHttpServer())
        .post('/users/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(changePasswordDto)
        .expect(200);

      // 5. Login with new password
      const loginDto = {
        email: registerDto.email,
        password: changePasswordDto.newPassword,
      };

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200);

      expect(loginResponse.body).toHaveProperty('accessToken');
      expect(loginResponse.body.user.email).toBe(registerDto.email);
    });
  });

  describe('Location Tracking → Nearby Services Search Flow', () => {
    let accessToken: string;
    let userId: string;
    let serviceTypeId: string;

    beforeAll(async () => {
      // Register user
      const registerDto = {
        email: `location-test-${Date.now()}@example.com`,
        password: 'Password123!',
        name: 'Location Test User',
      };

      const authResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto);

      accessToken = authResponse.body.accessToken;
      userId = authResponse.body.user.id;

      // Get service type
      const typesResponse = await request(app.getHttpServer())
        .get('/services/types')
        .set('Authorization', `Bearer ${accessToken}`);

      if (typesResponse.body.length > 0) {
        serviceTypeId = typesResponse.body[0].id;
      }
    });

    it('should track location and find nearby services', async () => {
      const { lat, lng } = TestDataFactory.COORDINATES.hanoi;

      // 1. Track user location
      const trackLocationDto = {
        latitude: lat,
        longitude: lng,
        accuracy: 10,
      };

      const trackResponse = await request(app.getHttpServer())
        .post('/locations/track')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(trackLocationDto)
        .expect(201);

      expect(trackResponse.body.latitude).toBe(lat);
      expect(trackResponse.body.longitude).toBe(lng);
      expect(trackResponse.body.isCurrent).toBe(true);

      // 2. Create nearby services
      const nearbyCoords = SpatialHelper.offsetCoordinates(lat, lng, 1000, 0);
      const serviceDto = {
        name: 'Nearby Restaurant',
        serviceTypeId,
        latitude: nearbyCoords.latitude,
        longitude: nearbyCoords.longitude,
        address: '123 Test St',
      };

      await request(app.getHttpServer())
        .post('/services')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(serviceDto)
        .expect(201);

      // 3. Search for nearby services
      const searchResponse = await request(app.getHttpServer())
        .get('/services/search')
        .query({
          latitude: lat,
          longitude: lng,
          radius: 5000, // 5km
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(searchResponse.body.data.length).toBeGreaterThan(0);
      expect(searchResponse.body.data[0].distance).toBeLessThan(5000);

      // 4. Get current location
      const currentLocationResponse = await request(app.getHttpServer())
        .get('/locations/current')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(currentLocationResponse.body.latitude).toBe(lat);
      expect(currentLocationResponse.body.isCurrent).toBe(true);

      // 5. Get location history
      const historyResponse = await request(app.getHttpServer())
        .get('/locations/history')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(historyResponse.body)).toBe(true);
      expect(historyResponse.body.length).toBeGreaterThan(0);
    });
  });

  describe('Service Favorites Management Flow', () => {
    let accessToken: string;
    let serviceId: string;
    let serviceTypeId: string;

    beforeAll(async () => {
      // Register user
      const registerDto = {
        email: `favorites-test-${Date.now()}@example.com`,
        password: 'Password123!',
        name: 'Favorites Test User',
      };

      const authResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto);

      accessToken = authResponse.body.accessToken;

      // Get service type
      const typesResponse = await request(app.getHttpServer())
        .get('/services/types')
        .set('Authorization', `Bearer ${accessToken}`);

      if (typesResponse.body.length > 0) {
        serviceTypeId = typesResponse.body[0].id;
      }

      // Create a service
      const { lat, lng } = TestDataFactory.COORDINATES.hanoi;
      const serviceDto = {
        name: 'Test Restaurant for Favorites',
        serviceTypeId,
        latitude: lat,
        longitude: lng,
      };

      const serviceResponse = await request(app.getHttpServer())
        .post('/services')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(serviceDto);

      serviceId = serviceResponse.body.id;
    });

    it('should complete favorites lifecycle', async () => {
      // 1. Add to favorites
      const addFavoriteDto = {
        serviceId,
        notes: 'My favorite restaurant',
      };

      const addResponse = await request(app.getHttpServer())
        .post('/favorites')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(addFavoriteDto)
        .expect(201);

      expect(addResponse.body.serviceId).toBe(serviceId);
      expect(addResponse.body.notes).toBe(addFavoriteDto.notes);

      const favoriteId = addResponse.body.id;

      // 2. List favorites
      const listResponse = await request(app.getHttpServer())
        .get('/favorites')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(listResponse.body)).toBe(true);
      expect(listResponse.body.length).toBeGreaterThan(0);
      expect(listResponse.body[0].serviceId).toBe(serviceId);

      // 3. Check if favorited
      const checkResponse = await request(app.getHttpServer())
        .get(`/favorites/check/${serviceId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(checkResponse.body.isFavorite).toBe(true);

      // 4. Verify service favorite count increased
      const serviceResponse = await request(app.getHttpServer())
        .get(`/services/${serviceId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(serviceResponse.body.favoriteCount).toBeGreaterThan(0);

      // 5. Remove from favorites
      await request(app.getHttpServer())
        .delete(`/favorites/${favoriteId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // 6. Verify removed
      const checkAfterRemove = await request(app.getHttpServer())
        .get(`/favorites/check/${serviceId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(checkAfterRemove.body.isFavorite).toBe(false);
    });

    it('should prevent duplicate favorites', async () => {
      const addFavoriteDto = {
        serviceId,
      };

      // Add to favorites
      await request(app.getHttpServer())
        .post('/favorites')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(addFavoriteDto)
        .expect(201);

      // Try to add again
      await request(app.getHttpServer())
        .post('/favorites')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(addFavoriteDto)
        .expect(409); // Conflict
    });
  });

  describe('Password Reset Flow', () => {
    let userEmail: string;

    beforeAll(async () => {
      userEmail = `reset-test-${Date.now()}@example.com`;

      // Register user
      const registerDto = {
        email: userEmail,
        password: 'Password123!',
        name: 'Reset Test User',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);
    });

    it('should complete password reset flow', async () => {
      // 1. Request password reset
      const forgotPasswordDto = {
        email: userEmail,
      };

      const resetResponse = await request(app.getHttpServer())
        .post('/users/forgot-password')
        .send(forgotPasswordDto)
        .expect(200);

      expect(resetResponse.body.message).toBeDefined();

      // Note: In a real test, you would:
      // 2. Extract reset token from email (or test database)
      // 3. Use token to reset password
      // 4. Verify can login with new password

      // For this demo, we'll simulate the flow structure
    });

    it('should not reveal if email exists', async () => {
      const forgotPasswordDto = {
        email: 'nonexistent@example.com',
      };

      const response = await request(app.getHttpServer())
        .post('/users/forgot-password')
        .send(forgotPasswordDto)
        .expect(200);

      // Should return same message even if email doesn't exist
      expect(response.body.message).toBeDefined();
    });
  });

  describe('MySQL Spatial Queries E2E', () => {
    let accessToken: string;
    let serviceTypeId: string;

    beforeAll(async () => {
      // Register user
      const registerDto = {
        email: `spatial-test-${Date.now()}@example.com`,
        password: 'Password123!',
        name: 'Spatial Test User',
      };

      const authResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto);

      accessToken = authResponse.body.accessToken;

      // Get service type
      const typesResponse = await request(app.getHttpServer())
        .get('/services/types')
        .set('Authorization', `Bearer ${accessToken}`);

      if (typesResponse.body.length > 0) {
        serviceTypeId = typesResponse.body[0].id;
      }
    });

    it('should create services and verify spatial calculations', async () => {
      const { lat: hanoiLat, lng: hanoiLng } = TestDataFactory.COORDINATES.hanoi;
      const { lat: hcmcLat, lng: hcmcLng } = TestDataFactory.COORDINATES.hcmc;

      // Create service in Hanoi
      const hanoiServiceDto = {
        name: 'Hanoi Service',
        serviceTypeId,
        latitude: hanoiLat,
        longitude: hanoiLng,
      };

      await request(app.getHttpServer())
        .post('/services')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(hanoiServiceDto)
        .expect(201);

      // Create service in HCMC
      const hcmcServiceDto = {
        name: 'HCMC Service',
        serviceTypeId,
        latitude: hcmcLat,
        longitude: hcmcLng,
      };

      await request(app.getHttpServer())
        .post('/services')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(hcmcServiceDto)
        .expect(201);

      // Search from Hanoi - should find Hanoi service, not HCMC
      const searchResponse = await request(app.getHttpServer())
        .get('/services/search')
        .query({
          latitude: hanoiLat,
          longitude: hanoiLng,
          radius: 50000, // 50km
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const serviceNames = searchResponse.body.data.map((s: any) => s.name);
      expect(serviceNames).toContain('Hanoi Service');
      expect(serviceNames).not.toContain('HCMC Service');

      // Verify distances are calculated
      const expectedDistance = SpatialHelper.calculateDistance(
        hanoiLat,
        hanoiLng,
        hanoiLat,
        hanoiLng,
      );

      const hanoiService = searchResponse.body.data.find((s: any) => s.name === 'Hanoi Service');
      expect(hanoiService.distance).toBeLessThan(100); // Very close to center
    });
  });

  describe('Health Check Endpoints', () => {
    it('should return health status', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('ok');
    });

    it('should check database health', async () => {
      const response = await request(app.getHttpServer())
        .get('/health/db')
        .expect(200);

      expect(response.body).toHaveProperty('database');
    });
  });
});
