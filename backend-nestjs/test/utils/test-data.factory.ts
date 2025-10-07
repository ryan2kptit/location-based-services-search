import { User, UserRole, UserStatus } from '../../src/users/entities/user.entity';
import { Service, ServiceStatus } from '../../src/services/entities/service.entity';
import { ServiceType } from '../../src/services/entities/service-type.entity';
import { UserLocation } from '../../src/locations/entities/user-location.entity';
import { Favorite } from '../../src/favorites/entities/favorite.entity';
import { RefreshToken } from '../../src/users/entities/refresh-token.entity';
import { PasswordResetToken } from '../../src/users/entities/password-reset-token.entity';

export class TestDataFactory {
  // Test coordinates for various locations
  static readonly COORDINATES = {
    hanoi: { lat: 21.0285, lng: 105.8542 },
    hcmc: { lat: 10.8231, lng: 106.6297 },
    danang: { lat: 16.0544, lng: 108.2022 },
    haiphong: { lat: 20.8449, lng: 106.6881 },
    canTho: { lat: 10.0452, lng: 105.7469 },
  };

  // Calculate distance between two coordinates (Haversine formula)
  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  static createUser(overrides: Partial<User> = {}): User {
    const user = new User();
    user.id = overrides.id || 'test-user-id';
    user.email = overrides.email || 'test@example.com';
    user.name = overrides.name || 'Test User';
    user.password = overrides.password || '$2b$12$hashedPassword';
    user.role = overrides.role || UserRole.USER;
    user.status = overrides.status || UserStatus.ACTIVE;
    user.phone = overrides.phone || '+84123456789';
    user.avatar = overrides.avatar || null;
    user.emailVerified = overrides.emailVerified ?? false;
    user.lastLoginAt = overrides.lastLoginAt || new Date();
    user.createdAt = overrides.createdAt || new Date();
    user.updatedAt = overrides.updatedAt || new Date();
    user.deletedAt = overrides.deletedAt || null;
    return user;
  }

  static createService(overrides: Partial<Service> = {}): Service {
    const service = new Service();
    const { lat, lng } = this.COORDINATES.hanoi;

    service.id = overrides.id || 'test-service-id';
    service.name = overrides.name || 'Test Service';
    service.description = overrides.description || 'Test service description';
    service.serviceTypeId = overrides.serviceTypeId || 'test-type-id';
    service.latitude = overrides.latitude ?? lat;
    service.longitude = overrides.longitude ?? lng;
    service.location = overrides.location || `POINT(${overrides.longitude ?? lng} ${overrides.latitude ?? lat})`;
    service.address = overrides.address || '123 Test St';
    service.city = overrides.city || 'Hanoi';
    service.state = overrides.state || 'Hanoi';
    service.country = overrides.country || 'Vietnam';
    service.postalCode = overrides.postalCode || '100000';
    service.phone = overrides.phone || '+84123456789';
    service.email = overrides.email || 'service@example.com';
    service.website = overrides.website || 'https://example.com';
    service.openingHours = overrides.openingHours || null;
    service.rating = overrides.rating ?? 4.5;
    service.reviewCount = overrides.reviewCount || 10;
    service.priceRange = overrides.priceRange ?? null;
    service.tags = overrides.tags || ['test', 'service'];
    service.images = overrides.images || [];
    service.status = overrides.status || ServiceStatus.ACTIVE;
    service.isVerified = overrides.isVerified ?? true;
    service.isFeatured = overrides.isFeatured ?? false;
    service.viewCount = overrides.viewCount || 0;
    service.favoriteCount = overrides.favoriteCount || 0;
    service.createdAt = overrides.createdAt || new Date();
    service.updatedAt = overrides.updatedAt || new Date();
    service.deletedAt = overrides.deletedAt || null;
    return service;
  }

  static createServiceType(overrides: Partial<ServiceType> = {}): ServiceType {
    const serviceType = new ServiceType();
    serviceType.id = overrides.id || 'test-type-id';
    serviceType.name = overrides.name || 'Test Type';
    serviceType.slug = overrides.slug || 'test-type';
    serviceType.description = overrides.description || 'Test type description';
    serviceType.icon = overrides.icon || 'test-icon';
    serviceType.isActive = overrides.isActive ?? true;
    serviceType.createdAt = overrides.createdAt || new Date();
    serviceType.updatedAt = overrides.updatedAt || new Date();
    return serviceType;
  }

  static createUserLocation(overrides: Partial<UserLocation> = {}): UserLocation {
    const location = new UserLocation();
    const { lat, lng } = this.COORDINATES.hanoi;

    location.id = overrides.id || 'test-location-id';
    location.userId = overrides.userId || 'test-user-id';
    location.name = overrides.name || 'Test Location';
    location.address = overrides.address || '123 Test St';
    location.latitude = overrides.latitude ?? lat;
    location.longitude = overrides.longitude ?? lng;
    location.location = overrides.location || `POINT(${overrides.longitude ?? lng} ${overrides.latitude ?? lat})`;
    location.type = overrides.type || 'other';
    location.isDefault = overrides.isDefault ?? false;
    location.createdAt = overrides.createdAt || new Date();
    location.updatedAt = overrides.updatedAt || new Date();
    return location;
  }

  static createFavorite(overrides: Partial<Favorite> = {}): Favorite {
    const favorite = new Favorite();
    favorite.id = overrides.id || 'test-favorite-id';
    favorite.userId = overrides.userId || 'test-user-id';
    favorite.serviceId = overrides.serviceId || 'test-service-id';
    favorite.createdAt = overrides.createdAt || new Date();
    return favorite;
  }

  static createRefreshToken(overrides: Partial<RefreshToken> = {}): RefreshToken {
    const token = new RefreshToken();
    token.id = overrides.id || 'test-token-id';
    token.userId = overrides.userId || 'test-user-id';
    token.token = overrides.token || 'test-refresh-token';
    token.expiresAt = overrides.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    token.isRevoked = overrides.isRevoked ?? false;
    token.revokedAt = overrides.revokedAt || null;
    token.deviceInfo = overrides.deviceInfo || { userAgent: 'test-agent' };
    token.ipAddress = overrides.ipAddress || '127.0.0.1';
    token.createdAt = overrides.createdAt || new Date();
    return token;
  }

  static createPasswordResetToken(overrides: Partial<PasswordResetToken> = {}): PasswordResetToken {
    const token = new PasswordResetToken();
    token.id = overrides.id || 'test-reset-token-id';
    token.userId = overrides.userId || 'test-user-id';
    token.token = overrides.token || 'test-reset-token';
    token.expiresAt = overrides.expiresAt || new Date(Date.now() + 60 * 60 * 1000);
    token.isUsed = overrides.isUsed ?? false;
    token.usedAt = overrides.usedAt || null;
    token.createdAt = overrides.createdAt || new Date();
    return token;
  }

  // Helper to create multiple services at different locations
  static createServicesAtLocations(count: number = 5): Service[] {
    const locations = Object.values(this.COORDINATES);
    const services: Service[] = [];

    for (let i = 0; i < count; i++) {
      const location = locations[i % locations.length];
      services.push(
        this.createService({
          id: `service-${i}`,
          name: `Service ${i}`,
          latitude: location.lat,
          longitude: location.lng,
          location: `POINT(${location.lng} ${location.lat})`,
        }),
      );
    }

    return services;
  }
}
