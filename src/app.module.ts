import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { OlympicsModule } from './olympics/olympics.module';

@Module({
  imports: [AuthModule, OlympicsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
