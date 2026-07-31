import { Module } from '@nestjs/common';
import { StaffController } from './staff.controller';
import { StaffUseCase } from './staff.use-case';
import { PrismaService } from '@/common/prisma.service';

@Module({
  controllers: [StaffController],
  providers: [StaffUseCase, PrismaService],
})
export class StaffModule {}
