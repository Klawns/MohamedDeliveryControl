import { Module, Logger } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { OutputSanitizerInterceptor } from './common/interceptors/output-sanitizer.interceptor';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { ThrottlerStorageRedisService } from 'nestjs-throttler-storage-redis';
import { LoggerModule } from 'nestjs-pino';
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
import { getRedisConfig } from './common/utils/redis.util';
import { UploadModule } from './upload/upload.module';
import { FinanceModule } from './finance/finance.module';
import { DebugModule } from './debug/debug.module';
import { BackupsModule } from './backups/backups.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { validateEnv } from './common/config/env.validation';
import type { RedisHostConfig } from './common/utils/redis.util';

const SENSITIVE_LIMIT_METADATA = 'THROTTLER:LIMITsensitive';

function shouldSkipSensitiveThrottle(context: ExecutionContext) {
  const handler = context.getHandler();
  const classRef = context.getClass();

  return (
    !Reflect.hasMetadata(SENSITIVE_LIMIT_METADATA, handler) &&
    !Reflect.hasMetadata(SENSITIVE_LIMIT_METADATA, classRef)
  );
}

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true } }
            : undefined,
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.headers["x-internal-debug-key"]',
            'res.headers["set-cookie"]',
            'req.body.password',
            'req.body.token',
            'req.body.refreshToken',
            'req.body.accessToken',
            'req.body.taxId',
            'req.body.cellphone',
            'req.body.secret',
            'req.body.key',
            'req.body.apiKey',
            'req.body.webhookSecret',
            'password',
            'token',
            'refreshToken',
            'accessToken',
            'taxId',
            'cellphone',
            'secret',
            'key',
            'apiKey',
            'webhookSecret',
          ],
          censor: '[MASKED]',
        },
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', 'apps/api/.env'],
      validate: validateEnv,
    }),
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisConfig = getRedisConfig(config);

        return {
          throttlers: [
            {
              name: 'default',
              ttl: 60000,
              limit: 100, // Global limit per minute
            },
            {
              name: 'sensitive',
              ttl: 60000,
              limit: 10, // More restrictive for login/register
              skipIf: shouldSkipSensitiveThrottle,
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
      useFactory: (configService: ConfigService) => {
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
          } catch (error: unknown) {
            Logger.error(
              'Falha ao parsear URL do Redis para BullMQ',
              error instanceof Error ? error.stack : undefined,
            );
            return {
              connection: {
                host: 'localhost',
                port: 6379,
                maxRetriesPerRequest: null,
              },
            };
          }
        }

        const configObj: RedisHostConfig = redisConfig;
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
    BackupsModule,
    ...(process.env.ENABLE_DEBUG_ENDPOINTS === 'true' &&
    (process.env.INTERNAL_DEBUG_KEY?.length ?? 0) >= 16
      ? [DebugModule]
      : []),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // Ativa a proteção em todas as rotas
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // Ativa autenticação obrigatória por padrão
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: OutputSanitizerInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
