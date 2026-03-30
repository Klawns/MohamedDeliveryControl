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

  onModuleInit() {
    if (!hasRedisConfig(this.configService)) {
      this.enableMemoryFallback(
        'Nenhuma configuracao Redis encontrada. Usando cache em memoria neste processo.',
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
        this.enableMemoryFallback(
          'REDIS_URL invalida. Usando cache em memoria.',
          error,
        );
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
      this.enableMemoryFallback(
        'Falha na conexao Redis. Alternando para cache em memoria.',
        error,
      );
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
      this.enableMemoryFallback(
        `Erro ao buscar cache [${key}]. Alternando para memoria.`,
        error,
      );
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
      this.enableMemoryFallback(
        `Erro ao salvar cache [${key}]. Alternando para memoria.`,
        error,
      );
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
      this.enableMemoryFallback(
        `Erro ao deletar cache [${key}]. Alternando para memoria.`,
        error,
      );
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
      this.enableMemoryFallback(
        `Erro ao buscar e deletar cache [${key}]. Alternando para memoria.`,
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
      this.enableMemoryFallback(
        `Erro ao invalidar prefixo [${prefix}]. Alternando para memoria.`,
        error,
      );

      for (const key of Array.from(this.memoryStore.keys())) {
        if (key.startsWith(prefix)) {
          this.memoryStore.delete(key);
        }
      }
    }
  }
}
