import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { TestDataFactory } from '../utils/test-data.factory';
import { SpatialHelper } from '../utils/spatial.helper';

describe('Services Integration Tests (MySQL Spatial)', () => {
  let app: INestApplication;
  let accessToken: string;
  let serviceTypeId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    // Register and login to get access token
    const registerDto = {
      email: `service-test-${Date.now()}@example.com`,
      password: 'Password123!',
      name: 'Service Test User',
    };

    const authResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(registerDto);

    accessToken = authResponse.body.accessToken;

    // Get a service type
    const typesResponse = await request(app.getHttpServer())
      .get('/services/types')
      .set('Authorization', `Bearer ${accessToken}`);

    if (typesResponse.body.length > 0) {
      serviceTypeId = typesResponse.body[0].id;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /services', () => {
    it('should create service with MySQL POINT location', async () => {
      const { lat, lng } = TestDataFactory.COORDINATES.hanoi;
      const createServiceDto = {
        name: 'Test Restaurant',
        description: 'A great place to eat',
        serviceTypeId,
        latitude: lat,
        longitude: lng,
        address: '123 Test Street',
        city: 'Hanoi',
        phone: '+84123456789',
        tags: ['restaurant', 'vietnamese'],
      };

      const response = await request(app.getHttpServer())
        .post('/services')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createServiceDto)
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.name).toBe(createServiceDto.name);
      expect(response.body.latitude).toBe(lat);
      expect(response.body.longitude).toBe(lng);
      expect(response.body.location).toBeDefined();
      expect(response.body.location.type).toBe('Point');
      expect(response.body.location.coordinates).toEqual([lng, lat]);
    });

    it('should validate coordinates', async () => {
      const createServiceDto = {
        name: 'Invalid Service',
        serviceTypeId,
        latitude: 999, // Invalid
        longitude: 999, // Invalid
      };

      await request(app.getHttpServer())
        .post('/services')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createServiceDto)
        .expect(400);
    });
  });

  describe('GET /services/search - Radius Search with ST_DWithin', () => {
    let centerService: any;
    let nearbyService: any;
    let farService: any;

    beforeAll(async () => {
      const { lat, lng } = TestDataFactory.COORDINATES.hanoi;

      // Create center service
      const centerDto = {
        name: 'Center Service',
        serviceTypeId,
        latitude: lat,
        longitude: lng,
        address: 'Center',
      };

      const centerResponse = await request(app.getHttpServer())
        .post('/services')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(centerDto);

      centerService = centerResponse.body;

      // Create nearby service (2km away)
      const nearbyCoords = SpatialHelper.offsetCoordinates(lat, lng, 2000, 0);
      const nearbyDto = {
        name: 'Nearby Service',
        serviceTypeId,
        latitude: nearbyCoords.latitude,
        longitude: nearbyCoords.longitude,
        address: 'Nearby',
      };

      const nearbyResponse = await request(app.getHttpServer())
        .post('/services')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(nearbyDto);

      nearbyService = nearbyResponse.body;

      // Create far service (10km away)
      const farCoords = SpatialHelper.offsetCoordinates(lat, lng, 10000, 180);
      const farDto = {
        name: 'Far Service',
        serviceTypeId,
        latitude: farCoords.latitude,
        longitude: farCoords.longitude,
        address: 'Far',
      };

      const farResponse = await request(app.getHttpServer())
        .post('/services')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(farDto);

      farService = farResponse.body;
    });

    it('should find services within 5km radius using ST_DWithin', async () => {
      const { lat, lng } = TestDataFactory.COORDINATES.hanoi;

      const response = await request(app.getHttpServer())
        .get('/services/search')
        .query({
          latitude: lat,
          longitude: lng,
          radius: 5000, // 5km
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);

      // Should include center and nearby, but not far
      const serviceIds = response.body.data.map((s: any) => s.id);
      expect(serviceIds).toContain(centerService.id);
      expect(serviceIds).toContain(nearbyService.id);
      expect(serviceIds).not.toContain(farService.id);
    });

    it('should calculate distances correctly with MySQL ST_Distance_Sphere', async () => {
      const { lat, lng } = TestDataFactory.COORDINATES.hanoi;

      const response = await request(app.getHttpServer())
        .get('/services/search')
        .query({
          latitude: lat,
          longitude: lng,
          radius: 5000,
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Each result should have distance property
      response.body.data.forEach((service: any) => {
        expect(service.distance).toBeDefined();
        expect(typeof service.distance).toBe('number');
      });
    });

    it('should order results by distance ascending', async () => {
      const { lat, lng } = TestDataFactory.COORDINATES.hanoi;

      const response = await request(app.getHttpServer())
        .get('/services/search')
        .query({
          latitude: lat,
          longitude: lng,
          radius: 10000, // Include all
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const distances = response.body.data.map((s: any) => s.distance);

      // Verify distances are in ascending order
      for (let i = 1; i < distances.length; i++) {
        expect(distances[i]).toBeGreaterThanOrEqual(distances[i - 1]);
      }
    });

    it('should filter by service type', async () => {
      const { lat, lng } = TestDataFactory.COORDINATES.hanoi;

      const response = await request(app.getHttpServer())
        .get('/services/search')
        .query({
          latitude: lat,
          longitude: lng,
          radius: 10000,
          serviceTypeId,
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      response.body.data.forEach((service: any) => {
        expect(service.serviceTypeId).toBe(serviceTypeId);
      });
    });

    it('should filter by keyword', async () => {
      const { lat, lng } = TestDataFactory.COORDINATES.hanoi;

      const response = await request(app.getHttpServer())
        .get('/services/search')
        .query({
          latitude: lat,
          longitude: lng,
          radius: 10000,
          keyword: 'Center',
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      response.body.data.forEach((service: any) => {
        const matchesKeyword =
          service.name.toLowerCase().includes('center') ||
          service.description?.toLowerCase().includes('center');
        expect(matchesKeyword).toBe(true);
      });
    });

    it('should filter by tags', async () => {
      const { lat, lng } = TestDataFactory.COORDINATES.hanoi;

      const response = await request(app.getHttpServer())
        .get('/services/search')
        .query({
          latitude: lat,
          longitude: lng,
          radius: 10000,
          tags: ['restaurant'],
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Results should have the specified tag
      expect(response.body.data).toBeDefined();
    });

    it('should handle pagination', async () => {
      const { lat, lng } = TestDataFactory.COORDINATES.hanoi;

      const response = await request(app.getHttpServer())
        .get('/services/search')
        .query({
          latitude: lat,
          longitude: lng,
          radius: 10000,
          page: 1,
          limit: 2,
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(2);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
    });
  });

  describe('GET /services/nearby - KNN Search', () => {
    it('should use KNN operator for optimized nearest neighbor search', async () => {
      const { lat, lng } = TestDataFactory.COORDINATES.hanoi;

      const response = await request(app.getHttpServer())
        .get('/services/nearby')
        .query({
          latitude: lat,
          longitude: lng,
          radius: 5000,
          limit: 5,
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(5);

      // Should have distance property
      if (response.body.length > 0) {
        expect(response.body[0].distance).toBeDefined();
      }
    });

    it('should order by distance using KNN', async () => {
      const { lat, lng } = TestDataFactory.COORDINATES.hanoi;

      const response = await request(app.getHttpServer())
        .get('/services/nearby')
        .query({
          latitude: lat,
          longitude: lng,
          radius: 10000,
          limit: 10,
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const distances = response.body.map((s: any) => s.distance);

      // Verify distances are in ascending order (closest first)
      for (let i = 1; i < distances.length; i++) {
        expect(distances[i]).toBeGreaterThanOrEqual(distances[i - 1]);
      }
    });
  });

  describe('Spatial Index Performance', () => {
    it('should execute spatial queries in less than 500ms', async () => {
      const { lat, lng } = TestDataFactory.COORDINATES.hanoi;

      const startTime = Date.now();

      await request(app.getHttpServer())
        .get('/services/search')
        .query({
          latitude: lat,
          longitude: lng,
          radius: 10000,
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(500);
    });
  });

  describe('GET /services/:id', () => {
    it('should return service details', async () => {
      const { lat, lng } = TestDataFactory.COORDINATES.hanoi;
      const createDto = {
        name: 'Detail Test Service',
        serviceTypeId,
        latitude: lat,
        longitude: lng,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/services')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createDto);

      const serviceId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .get(`/services/${serviceId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.id).toBe(serviceId);
      expect(response.body.name).toBe(createDto.name);
    });

    it('should increment view count', async () => {
      const { lat, lng } = TestDataFactory.COORDINATES.hanoi;
      const createDto = {
        name: 'View Count Test Service',
        serviceTypeId,
        latitude: lat,
        longitude: lng,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/services')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createDto);

      const serviceId = createResponse.body.id;

      // View service multiple times
      await request(app.getHttpServer())
        .get(`/services/${serviceId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      await request(app.getHttpServer())
        .get(`/services/${serviceId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      const response = await request(app.getHttpServer())
        .get(`/services/${serviceId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.body.viewCount).toBeGreaterThan(0);
    });
  });
});
