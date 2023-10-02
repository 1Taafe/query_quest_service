import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { PrismaService } from 'src/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { Constants } from './secrets';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: Constants.jwtSecret,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [AuthService, PrismaService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}