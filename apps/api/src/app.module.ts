import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { Redis } from 'ioredis';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerStorageRedisService } from 'nestjs-throttler-storage-redis';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { CacheModule } from './cache/cache.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { RidesModule } from './rides/rides.module';
import { PaymentsModule } from './payments/payments.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { AdminModule } from './admin/admin.module';
import { SettingsModule } from './settings/settings.module';
import { DebugController } from './debug/debug.controller';
import { getRedisConfig } from './common/utils/redis.util';
import { UploadModule } from './upload/upload.module';
import { FinanceModule } from './finance/finance.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', 'apps/api/.env'],
    }),
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisConfig = getRedisConfig(config);

        return {
          throttlers: [
            {
              ttl: 60000,
              limit: 200,
            },
          ],
          storage:
            typeof redisConfig === 'string'
              ? new ThrottlerStorageRedisService(redisConfig)
              : new ThrottlerStorageRedisService({
                  host: redisConfig.host,
                  port: redisConfig.port,
                  password: redisConfig.password,
                }),
        };
      },
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisConfig = getRedisConfig(configService);

        if (typeof redisConfig === 'string') {
          try {
            const url = new URL(redisConfig);
            return {
              connection: {
                host: url.hostname,
                port: parseInt(url.port, 10),
                username: url.username || undefined,
                password: url.password || undefined,
                tls: url.protocol === 'rediss:' ? {} : undefined,
                maxRetriesPerRequest: null,
              },
            };
          } catch (e) {
            console.error('Falha ao parsear URL do Redis para BullMQ', e);
          }
        }

        const configObj = redisConfig as any;
        return {
          connection: {
            host: configObj.host,
            port: configObj.port,
            password: configObj.password,
            username: configObj.username,
            tls: configObj.tls,
            maxRetriesPerRequest: null,
          },
        };
      },
    }),
    DatabaseModule,
    CacheModule,
    UsersModule,
    AuthModule,
    ClientsModule,
    RidesModule,
    PaymentsModule,
    SubscriptionsModule,
    AdminModule,
    SettingsModule,
    UploadModule,
    FinanceModule,
  ],
  controllers: [AppController, DebugController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // Ativa a proteção em todas as rotas
    },
  ],
})
export class AppModule {}
