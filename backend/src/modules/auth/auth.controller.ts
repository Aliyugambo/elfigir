import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthUseCase } from './auth.use-case';
import { SignUpDto, SignInDto, AuthResponseDto, CreateStaffDto } from './auth.dto';
import { JwtGuard } from './jwt.guard';
import { RolesGuard } from '@/common/roles.guard';
import { Roles } from '@/common/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authUseCase: AuthUseCase) {}

  @Post('sign-up')
  @ApiOperation({ summary: 'Register a new customer' })
  async signUp(@Body() dto: SignUpDto): Promise<AuthResponseDto> {
    return this.authUseCase.signUp(dto);
  }

  @Post('staff')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin creates a CHEF or DELIVERY staff member' })
  async createStaff(@Req() req: any, @Body() dto: CreateStaffDto): Promise<AuthResponseDto> {
    return this.authUseCase.createStaff(req.user.sub, dto);
  }

  @Post('sign-in')
  @ApiOperation({ summary: 'Login user' })
  async signIn(@Body() dto: SignInDto): Promise<AuthResponseDto> {
    return this.authUseCase.signIn(dto);
  }

  @Get('profile')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Req() req: any) {
    return this.authUseCase.getProfile(req.user.sub);
  }
}
