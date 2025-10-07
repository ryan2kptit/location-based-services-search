export interface ServiceType {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  address: string;
  latitude: number;
  longitude: number;
  phoneNumber?: string;
  email?: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
  isActive: boolean;
  serviceType?: ServiceType;
  serviceTypeId: string;
  serviceTypeName?: string; // Added by search API as a flat field
  distance?: number; // Distance in meters (added by backend when searching nearby)
  createdAt: string;
  updatedAt: string;
}

export interface SearchServicesParams {
  latitude: number;
  longitude: number;
  radius?: number; // in meters
  serviceTypeId?: string;
  minRating?: number;
  keyword?: string;
  page?: number;
  limit?: number;
}

export interface NearbyServicesParams {
  latitude: number;
  longitude: number;
  radius?: number; // in meters
  serviceTypeId?: string;
}

export interface PaginatedServices {
  data: Service[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateServiceDto {
  name: string;
  description?: string;
  address: string;
  latitude: number;
  longitude: number;
  phoneNumber?: string;
  email?: string;
  website?: string;
  serviceTypeId: string;
}

export interface UpdateServiceDto extends Partial<CreateServiceDto> {}
