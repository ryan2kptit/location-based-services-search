import api from './api';
import type {
  Service,
  ServiceType,
  SearchServicesParams,
  NearbyServicesParams,
  PaginatedServices,
  CreateServiceDto,
  UpdateServiceDto,
} from '@/types/service.types';
import type { PaginationParams } from '@/types/api.types';

export const servicesService = {
  async getAllServices(
    page = 1,
    limit = 20
  ): Promise<PaginatedServices> {
    const params: PaginationParams = { page, limit };
    return api.get('/services', { params });
  },

  async searchServices(
    params: SearchServicesParams
  ): Promise<Service[]> {
    return api.get('/services/search', { params });
  },

  async getNearbyServices(
    params: NearbyServicesParams
  ): Promise<Service[]> {
    return api.get('/services/nearby', { params });
  },

  async getServiceTypes(): Promise<ServiceType[]> {
    return api.get('/services/types');
  },

  async getServiceById(id: string): Promise<Service> {
    return api.get(`/services/${id}`);
  },

  async createService(data: CreateServiceDto): Promise<Service> {
    return api.post('/services', data);
  },

  async updateService(
    id: string,
    data: UpdateServiceDto
  ): Promise<Service> {
    return api.patch(`/services/${id}`, data);
  },

  async deleteService(id: string): Promise<void> {
    return api.delete(`/services/${id}`);
  },
};
