import { Injectable } from '@nestjs/common';
import { AuthRepository } from './auth.repository';
import { SignUpDto, SignInDto, CreateStaffDto } from './auth.dto';

@Injectable()
export class AuthUseCase {
  constructor(private authRepository: AuthRepository) {}

  async signUp(dto: SignUpDto) {
    return this.authRepository.signUp(dto);
  }

  async createStaff(adminId: string, dto: CreateStaffDto) {
    return this.authRepository.createStaff(adminId, dto);
  }

  async signIn(dto: SignInDto) {
    return this.authRepository.signIn(dto);
  }

  async getProfile(userId: string) {
    return this.authRepository.getUserById(userId);
  }
}
