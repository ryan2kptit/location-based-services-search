export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const DEFAULT_MAP_CENTER: [number, number] = [10.762622, 106.660172]; // Ho Chi Minh City
export const DEFAULT_MAP_ZOOM = 13;

export const DEFAULT_SEARCH_RADIUS = 5000; // 5km in meters
export const MIN_SEARCH_RADIUS = 500; // 500m
export const MAX_SEARCH_RADIUS = 50000; // 50km

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
};

export const MAP_TILE_URL =
  import.meta.env.VITE_MAP_TILE_URL ||
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

export const MAP_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  SERVICES: '/services',
  SERVICE_DETAIL: '/services/:id',
  PROFILE: '/profile',
  FAVORITES: '/favorites',
  LOCATION_HISTORY: '/location-history',
} as const;

export const RATING_STARS = [1, 2, 3, 4, 5];

export const STORAGE_KEYS = {
  AUTH: 'auth-storage',
  LOCATION: 'location-storage',
} as const;
