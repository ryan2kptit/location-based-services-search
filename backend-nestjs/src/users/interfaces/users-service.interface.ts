import { User } from '../entities/user.entity';
import { UpdateUserDto } from '../dto/update-user.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';

export interface IUsersService {
  findOne(id: string): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  update(id: string, updateUserDto: UpdateUserDto): Promise<User>;
  changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void>;
  forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<string>;
  resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void>;
  remove(id: string): Promise<void>;
}
