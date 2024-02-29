import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';

@Module({
  imports: [
    
  ],
  providers: [TaskService, PrismaService],
  controllers: [TaskController],
  exports: [TaskService],
})
export class TaskModule {}