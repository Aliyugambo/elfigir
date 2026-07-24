import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { AuthService } from '@/common/auth.service';
import { SignUpDto, SignInDto, CreateStaffDto } from './auth.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthRepository {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) {}

  private async assertEmailAvailable(email: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new BadRequestException('Email already exists');
    }
  }

  private buildTokens(user: {
    id: string;
    email: string;
    role: UserRole;
  }) {
    const accessToken = this.authService.generateAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = this.authService.generateRefreshToken({
      sub: user.id,
    });

    return { accessToken, refreshToken };
  }

  private toResponse(user: any, tokens: { accessToken: string; refreshToken: string }) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async signUp(dto: SignUpDto) {
    await this.assertEmailAvailable(dto.email);

    const passwordHash = await this.authService.hashPassword(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        passwordHash,
        role: UserRole.CUSTOMER,
      },
    });

    return this.toResponse(user, this.buildTokens(user));
  }

  async createStaff(adminId: string, dto: CreateStaffDto) {
    if (dto.role === UserRole.CUSTOMER || dto.role === UserRole.ADMIN) {
      throw new BadRequestException(
        'Staff can only be created with CHEF or DELIVERY role',
      );
    }

    await this.assertEmailAvailable(dto.email);

    const passwordHash = await this.authService.hashPassword(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        passwordHash,
        role: dto.role,
        isActive: false,
      },
    });

    return this.toResponse(user, this.buildTokens(user));
  }

  async signIn(dto: SignInDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is pending approval');
    }

    const isPasswordValid = await this.authService.comparePasswords(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.toResponse(user, this.buildTokens(user));
  }

  async getUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        profileImage: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }
}
