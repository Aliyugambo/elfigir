import { Injectable, BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { AuthService } from '@/common/auth.service';
import { EmailService } from '@/common/email.service';
import { SignUpDto, SignInDto, CreateStaffDto } from './auth.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthRepository {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
    private emailService: EmailService,
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
    const normalizedPhone = dto.phone?.trim() || null;

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: normalizedPhone,
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
    const normalizedPhone = dto.phone?.trim() || null;

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: normalizedPhone,
        passwordHash,
        role: dto.role,
        isActive: false,
        restaurantId: dto.restaurantId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        restaurantId: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    const tokens = this.buildTokens(user);
    return {
      ...user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
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

    if (
      (user.role === UserRole.RESTAURANT || user.role === UserRole.DELIVERY) &&
      !user.emailVerified
    ) {
      throw new UnauthorizedException('Please verify your email before logging in');
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
        emailVerified: true,
        createdAt: true,
      },
    });
  }

  async createEmailVerificationToken(userId: string) {
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await this.prisma.emailVerification.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });

    return token;
  }

  async getUserByVerificationToken(token: string) {
    const verification = await this.prisma.emailVerification.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verification) {
      throw new NotFoundException('Invalid verification token');
    }

    if (verification.expiresAt < new Date()) {
      await this.prisma.emailVerification.delete({ where: { id: verification.id } });
      throw new BadRequestException('Verification token has expired');
    }

    return verification;
  }

  async verifyEmail(token: string) {
    const verification = await this.getUserByVerificationToken(token);

    await this.prisma.user.update({
      where: { id: verification.userId },
      data: { emailVerified: true },
    });

    await this.prisma.emailVerification.delete({ where: { id: verification.id } });

    return this.prisma.user.findUnique({
      where: { id: verification.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        emailVerified: true,
      },
    });
  }

  async sendVerificationEmail(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    const token = await this.createEmailVerificationToken(userId);
    await this.emailService.sendVerificationEmail(user.email, token, user.firstName);

    return { message: 'Verification email sent successfully' };
  }
}
