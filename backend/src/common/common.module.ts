import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { AuthService } from './auth.service';
import { CloudinaryService } from './cloudinary.service';
import { GeocodingService } from './geocoding.service';
import { EmailService } from './email.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRATION'),
        },
      }),
    }),
  ],
  providers: [PrismaService, AuthService, CloudinaryService, GeocodingService, EmailService],
  exports: [PrismaService, AuthService, CloudinaryService, GeocodingService, JwtModule, EmailService],
})
export class CommonModule {}
