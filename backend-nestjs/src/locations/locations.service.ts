import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { UserLocation } from './entities/user-location.entity';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { ILocationsService } from './interfaces/locations-service.interface';

@Injectable()
export class LocationsService implements ILocationsService {
  constructor(
    @InjectRepository(UserLocation)
    private locationRepository: Repository<UserLocation>,
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  async trackLocation(
    userId: string,
    createLocationDto: CreateLocationDto,
  ): Promise<UserLocation> {
    const { latitude, longitude, ...rest } = createLocationDto;

    // Use transaction to ensure atomicity of default location update and new location creation
    return await this.dataSource.transaction(async (entityManager) => {
      // If isDefault is true, mark all other locations as not default
      if (createLocationDto.isDefault) {
        await entityManager.update(
          UserLocation,
          { userId, isDefault: true },
          { isDefault: false },
        );
      }

      // Create new location with MySQL point using query builder
      const result = await entityManager
        .createQueryBuilder()
        .insert()
        .into(UserLocation)
        .values({
          userId,
          latitude,
          longitude,
          location: () => `ST_GeomFromText('POINT(${longitude} ${latitude})')`,
          ...rest,
        } as any)
        .execute();

      // Fetch the created location
      const createdLocation = await entityManager.findOne(UserLocation, {
        where: { id: result.identifiers[0].id },
      });

      if (!createdLocation) {
        throw new Error('Failed to create location');
      }

      return createdLocation;
    });
  }

  async getCurrentLocation(userId: string): Promise<UserLocation | null> {
    const location = await this.locationRepository.findOne({
      where: { userId, isDefault: true },
      order: { createdAt: 'DESC' },
    });

    return location;
  }

  async getLocationHistory(
    userId: string,
    limit: number = 100,
  ): Promise<UserLocation[]> {
    return this.locationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async updateLocation(
    userId: string,
    locationId: string,
    updateLocationDto: UpdateLocationDto,
  ): Promise<UserLocation> {
    const location = await this.locationRepository.findOne({
      where: { id: locationId, userId },
    });

    if (!location) {
      throw new NotFoundException('Location not found');
    }

    const { latitude, longitude, ...rest } = updateLocationDto;

    if (latitude !== undefined && longitude !== undefined) {
      location.latitude = latitude;
      location.longitude = longitude;
      location.location = `POINT(${longitude} ${latitude})` as any;
    }

    Object.assign(location, rest);

    return this.locationRepository.save(location);
  }

  async deleteLocation(userId: string, locationId: string): Promise<void> {
    const location = await this.locationRepository.findOne({
      where: { id: locationId, userId },
    });

    if (!location) {
      throw new NotFoundException('Location not found');
    }

    await this.locationRepository.remove(location);
  }

  async getNearbyUsers(
    latitude: number,
    longitude: number,
    radiusInMeters: number = 5000,
    limit: number = 20,
  ): Promise<any[]> {
    // Use MySQL ST_Distance_Sphere for radius search
    const query = `
      SELECT
        ul.*,
        ST_Distance_Sphere(
          ul.location,
          ST_GeomFromText('POINT(? ?)', 4326)
        ) as distance
      FROM user_locations ul
      WHERE ul.isDefault = true
        AND ST_Distance_Sphere(
          ul.location,
          ST_GeomFromText('POINT(? ?)', 4326)
        ) <= ?
      ORDER BY distance
      LIMIT ?
    `;

    const results = await this.locationRepository.query(query, [
      longitude,
      latitude,
      longitude,
      latitude,
      radiusInMeters,
      limit,
    ]);

    return results;
  }

  async getDistanceBetweenLocations(
    location1Id: string,
    location2Id: string,
  ): Promise<number> {
    const query = `
      SELECT ST_Distance_Sphere(
        l1.location,
        l2.location
      ) as distance
      FROM user_locations l1, user_locations l2
      WHERE l1.id = ? AND l2.id = ?
    `;

    const result = await this.locationRepository.query(query, [
      location1Id,
      location2Id,
    ]);

    return result[0]?.distance || 0;
  }
}
