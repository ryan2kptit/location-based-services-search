import api from './api';
import type { Favorite, CreateFavoriteDto } from '@/types/api.types';

export const favoritesService = {
  async addFavorite(serviceId: string): Promise<Favorite> {
    const data: CreateFavoriteDto = { serviceId };
    return api.post('/favorites', data);
  },

  async removeFavorite(id: string): Promise<void> {
    return api.delete(`/favorites/${id}`);
  },

  async getFavorites(): Promise<Favorite[]> {
    return api.get('/favorites');
  },

  async getFavoritesByType(serviceTypeId: string): Promise<Favorite[]> {
    return api.get('/favorites/by-type', {
      params: { serviceTypeId },
    });
  },
};
