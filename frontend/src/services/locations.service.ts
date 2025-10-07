import api from './api';
import type {
  TrackLocationDto,
  UserLocation,
  NearbyUser,
} from '@/types/location.types';

export const locationsService = {
  async trackLocation(data: TrackLocationDto): Promise<UserLocation> {
    return api.post('/locations/track', data);
  },

  async getCurrentLocation(): Promise<UserLocation> {
    return api.get('/locations/current');
  },

  async getLocationHistory(limit = 50): Promise<UserLocation[]> {
    return api.get('/locations/history', { params: { limit } });
  },

  async deleteLocation(id: string): Promise<void> {
    return api.delete(`/locations/${id}`);
  },

  async getNearbyUsers(
    latitude: number,
    longitude: number,
    radius = 1000
  ): Promise<NearbyUser[]> {
    return api.get('/locations/nearby-users', {
      params: { latitude, longitude, radius },
    });
  },
};
