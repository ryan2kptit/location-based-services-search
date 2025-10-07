import { User } from '../../users/entities/user.entity';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';

export interface IAuthService {
  register(registerDto: RegisterDto, req?: any): Promise<AuthResponseDto>;
  login(loginDto: LoginDto, req?: any): Promise<AuthResponseDto>;
  refresh(userId: string, tokenId: string, req?: any): Promise<AuthResponseDto>;
  logout(userId: string, tokenId?: string): Promise<void>;
  validateUser(email: string, password: string): Promise<User | null>;
}
