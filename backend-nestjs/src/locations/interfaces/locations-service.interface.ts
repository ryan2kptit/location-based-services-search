import { UserLocation } from '../entities/user-location.entity';
import { CreateLocationDto } from '../dto/create-location.dto';
import { UpdateLocationDto } from '../dto/update-location.dto';

export interface ILocationsService {
  trackLocation(userId: string, createLocationDto: CreateLocationDto): Promise<UserLocation>;
  getCurrentLocation(userId: string): Promise<UserLocation | null>;
  getLocationHistory(userId: string, limit?: number): Promise<UserLocation[]>;
  updateLocation(userId: string, locationId: string, updateLocationDto: UpdateLocationDto): Promise<UserLocation>;
  deleteLocation(userId: string, locationId: string): Promise<void>;
  getNearbyUsers(latitude: number, longitude: number, radiusInMeters?: number, limit?: number): Promise<any[]>;
  getDistanceBetweenLocations(location1Id: string, location2Id: string): Promise<number>;
}
