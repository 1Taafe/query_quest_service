import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { OlympicsService } from './olympics.service';
import { OlympicsController } from './olympics.controller';

@Module({
  imports: [
    
  ],
  providers: [OlympicsService, PrismaService],
  controllers: [OlympicsController],
  exports: [OlympicsService],
})
export class OlympicsModule {}