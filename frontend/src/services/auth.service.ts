import api from './api';
import type {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  RefreshTokenRequest,
} from '@/types/auth.types';

export const authService = {
  async register(data: RegisterData): Promise<AuthResponse> {
    return api.post('/auth/register', data);
  },

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return api.post('/auth/login', credentials);
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const data: RefreshTokenRequest = { refreshToken };
    return api.post('/auth/refresh', data);
  },

  async logout(): Promise<void> {
    return api.post('/auth/logout');
  },

  async getCurrentUser(): Promise<any> {
    return api.get('/auth/me');
  },
};
