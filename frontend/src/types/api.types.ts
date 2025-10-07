export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  statusCode?: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Favorite {
  id: string;
  userId: string;
  serviceId: string;
  service: any; // Will be populated with Service type
  createdAt: string;
}

export interface CreateFavoriteDto {
  serviceId: string;
}
