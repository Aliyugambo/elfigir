import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { CommonModule } from '@/common/common.module';
import { AuthController } from './auth.controller';
import { AuthUseCase } from './auth.use-case';
import { AuthRepository } from './auth.repository';
import { JwtStrategy, JwtGuard } from './jwt.guard';

@Module({
  imports: [CommonModule, PassportModule],
  controllers: [AuthController],
  providers: [AuthUseCase, AuthRepository, JwtStrategy, JwtGuard],
  exports: [AuthUseCase, JwtStrategy],
})
export class AuthModule {}
