import { Service } from '../entities/service.entity';
import { ServiceType } from '../entities/service-type.entity';
import { CreateServiceDto } from '../dto/create-service.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';
import { SearchServicesDto } from '../dto/search-services.dto';
import { PaginatedServiceResult, ServiceSearchResult } from '../services/services.service';

export interface IServicesService {
  create(createServiceDto: CreateServiceDto): Promise<Service>;
  search(searchDto: SearchServicesDto): Promise<PaginatedServiceResult>;
  searchNearby(
    latitude: number,
    longitude: number,
    radiusInMeters?: number,
    limit?: number,
  ): Promise<ServiceSearchResult[]>;
  findOne(id: string): Promise<Service>;
  findAll(page?: number, limit?: number): Promise<PaginatedServiceResult>;
  update(id: string, updateServiceDto: UpdateServiceDto): Promise<Service>;
  remove(id: string): Promise<void>;
  getServiceTypes(): Promise<ServiceType[]>;
  getServiceType(id: string): Promise<ServiceType>;
}
