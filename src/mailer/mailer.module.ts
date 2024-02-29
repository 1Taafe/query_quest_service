import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { MailerService } from './mailer.service';

@Module({
  imports: [
  ],
  providers: [MailerService],
  controllers: [],
  exports: [MailerService],
})
export class MailerModule {}