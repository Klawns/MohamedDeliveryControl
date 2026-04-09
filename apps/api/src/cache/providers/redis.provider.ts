import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { ICacheProvider } from '../interfaces/cache-provider.interface';
import { getRedisConfig, hasRedisConfig } from '../../common/utils/redis.util';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'erro desconhecido';
}

interface MemoryCacheEntry {
  value: string;
  expiresAt?: number;
}

@Injectable()
export class RedisCacheProvider
  implements ICacheProvider, OnModuleInit, OnModuleDestroy
{
  private redisClient!: Redis;
  private readonly logger = new Logger(RedisCacheProvider.name);
  private readonly memoryStore = new Map<string, MemoryCacheEntry>();
  private useMemoryFallback = false;

  constructor(private readonly configService: ConfigService) {}

  private getNodeEnv() {
    return (
      this.configService.get<string>('NODE_ENV') ??
      process.env.NODE_ENV ??
      'development'
    );
  }

  private canUseMemoryFallback() {
    return this.getNodeEnv() !== 'production';
  }

  onModuleInit() {
    if (!hasRedisConfig(this.configService)) {
      this.handleRedisFailure(
        'Redis e obrigatorio em producao para manter coerencia distribuida.',
      );
      return;
    }

    const redisConfig = getRedisConfig(this.configService);

    if (typeof redisConfig === 'string') {
      try {
        const url = new URL(redisConfig);
        this.redisClient = new Redis(redisConfig, {
          maxRetriesPerRequest: 3,
          retryStrategy(times) {
            return Math.min(times * 100, 3000);
          },
        });
        this.logger.debug(
          `[RedisCacheProvider] Conectando via URL: ${url.hostname}:${url.port}`,
        );
      } catch (error: unknown) {
        this.handleRedisFailure('REDIS_URL invalida.', error);
        return;
      }
    } else {
      this.redisClient = new Redis({
        host: redisConfig.host,
        port: redisConfig.port,
        username: redisConfig.username,
        password: redisConfig.password,
        tls: redisConfig.tls,
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          return Math.min(times * 100, 3000);
        },
      });
      this.logger.debug(
        `[RedisCacheProvider] Conectando via host/porta: ${redisConfig.host}:${redisConfig.port}`,
      );
    }

    this.redisClient.on('error', (error: Error) => {
      this.handleRedisFailure('Falha na conexao Redis.', error);
    });

    this.redisClient.on('ready', () => {
      this.logger.log('[RedisCacheProvider] Conectado com sucesso ao Redis.');
    });
  }

  onModuleDestroy() {
    if (this.redisClient) {
      this.redisClient.disconnect();
    }
  }

  private enableMemoryFallback(message: string, error?: unknown) {
    if (this.useMemoryFallback) {
      return;
    }

    this.useMemoryFallback = true;

    if (error) {
      this.logger.error(`${message} ${getErrorMessage(error)}`);
    } else {
      this.logger.warn(message);
    }

    if (this.redisClient) {
      this.redisClient.disconnect();
    }
  }

  private handleRedisFailure(message: string, error?: unknown) {
    if (this.canUseMemoryFallback()) {
      this.enableMemoryFallback(
        error
          ? `${message} Alternando para cache em memoria.`
          : `${message} Usando cache em memoria neste processo.`,
        error,
      );
      return;
    }

    if (error) {
      this.logger.error(`${message} ${getErrorMessage(error)}`);
      throw error instanceof Error ? error : new Error(message);
    }

    this.logger.error(message);
    throw new Error(message);
  }

  private pruneExpiredMemoryEntry(key: string) {
    const entry = this.memoryStore.get(key);
    if (!entry) {
      return;
    }

    if (entry.expiresAt && entry.expiresAt <= Date.now()) {
      this.memoryStore.delete(key);
    }
  }

  private getMemoryValue<T>(key: string): T | null {
    this.pruneExpiredMemoryEntry(key);
    const entry = this.memoryStore.get(key);

    if (!entry) {
      return null;
    }

    return JSON.parse(entry.value) as T;
  }

  private setMemoryValue(
    key: string,
    value: unknown,
    ttlSeconds?: number,
  ): void {
    this.memoryStore.set(key, {
      value: JSON.stringify(value),
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
    });
  }

  private delMemoryValue(key: string): void {
    this.memoryStore.delete(key);
  }

  private getDelMemoryValue<T>(key: string): T | null {
    const value = this.getMemoryValue<T>(key);
    this.memoryStore.delete(key);
    return value;
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.useMemoryFallback) {
      return this.getMemoryValue<T>(key);
    }

    try {
      const data = await this.redisClient.get(key);
      if (!data) {
        return null;
      }

      return JSON.parse(data) as T;
    } catch (error: unknown) {
      this.handleRedisFailure(`Erro ao buscar cache [${key}].`, error);
      return this.getMemoryValue<T>(key);
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    if (this.useMemoryFallback) {
      this.setMemoryValue(key, value, ttlSeconds);
      return;
    }

    try {
      const data = JSON.stringify(value);
      if (ttlSeconds) {
        await this.redisClient.set(key, data, 'EX', ttlSeconds);
        return;
      }

      await this.redisClient.set(key, data);
    } catch (error: unknown) {
      this.handleRedisFailure(`Erro ao salvar cache [${key}].`, error);
      this.setMemoryValue(key, value, ttlSeconds);
    }
  }

  async del(key: string): Promise<void> {
    if (this.useMemoryFallback) {
      this.delMemoryValue(key);
      return;
    }

    try {
      await this.redisClient.del(key);
    } catch (error: unknown) {
      this.handleRedisFailure(`Erro ao deletar cache [${key}].`, error);
      this.delMemoryValue(key);
    }
  }

  async getDel<T>(key: string): Promise<T | null> {
    if (this.useMemoryFallback) {
      return this.getDelMemoryValue<T>(key);
    }

    try {
      const data = await this.redisClient.call('getdel', key);
      if (!data) {
        return null;
      }

      return JSON.parse(data as string) as T;
    } catch (error: unknown) {
      this.handleRedisFailure(
        `Erro ao buscar e deletar cache [${key}].`,
        error,
      );
      return this.getDelMemoryValue<T>(key);
    }
  }

  async invalidatePrefix(prefix: string): Promise<void> {
    if (this.useMemoryFallback) {
      for (const key of Array.from(this.memoryStore.keys())) {
        if (key.startsWith(prefix)) {
          this.memoryStore.delete(key);
        }
      }
      return;
    }

    try {
      let cursor = '0';
      const keysToDelete: string[] = [];

      do {
        const [newCursor, keys] = await this.redisClient.scan(
          cursor,
          'MATCH',
          `${prefix}*`,
          'COUNT',
          100,
        );
        cursor = newCursor;
        keysToDelete.push(...keys);
      } while (cursor !== '0');

      if (keysToDelete.length > 0) {
        await this.redisClient.del(...keysToDelete);
      }
    } catch (error: unknown) {
      this.handleRedisFailure(`Erro ao invalidar prefixo [${prefix}].`, error);

      for (const key of Array.from(this.memoryStore.keys())) {
        if (key.startsWith(prefix)) {
          this.memoryStore.delete(key);
        }
      }
    }
  }
}
