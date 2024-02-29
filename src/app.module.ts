import { AuthModule } from './auth/auth.module';
import { OlympicsModule } from './olympics/olympics.module';
import { TaskModule } from './task/task.module';
import { MailerModule } from './mailer/mailer.module';

import {Module } from "@nestjs/common";
import * as redisStore from "cache-manager-redis-store";
import type { RedisClientOptions } from "redis";
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [AuthModule, OlympicsModule, TaskModule, MailerModule,  
    CacheModule.register({
      isGlobal: true,
      store: redisStore,
      host: 'localhost',
      port: 6379,
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
