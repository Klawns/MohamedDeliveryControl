import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { ICacheProvider } from '../interfaces/cache-provider.interface';
import { getRedisConfig } from '../../common/utils/redis.util';

@Injectable()
export class RedisCacheProvider
  implements ICacheProvider, OnModuleInit, OnModuleDestroy
{
  private redisClient: Redis;
  private readonly logger = new Logger(RedisCacheProvider.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const redisConfig = getRedisConfig(this.configService);

    if (typeof redisConfig === 'string') {
      this.logger.debug(
        `[RedisCacheProvider] 🔍 Usando URL p/ conexão Redis...`,
      );
      try {
        const url = new URL(redisConfig);
        this.redisClient = new Redis(redisConfig, {
          maxRetriesPerRequest: 3,
          retryStrategy(times) {
            return Math.min(times * 100, 3000);
          },
        });
        this.logger.debug(
          `[RedisCacheProvider] 🔄 Tentando conectar via URL: ${url.hostname}:${url.port}`,
        );
      } catch (e) {
        this.logger.error(
          `[RedisCacheProvider] ❌ Falha ao parsear REDIS_URL: ${e.message}`,
        );
        // Fallback para localhost em caso de URL inválida
        this.redisClient = new Redis('redis://localhost:6379');
      }
    } else {
      this.logger.debug(
        `[RedisCacheProvider] 🔍 Usando Host/Porta p/ conexão Redis (${redisConfig.host}:${redisConfig.port})...`,
      );
      this.redisClient = new Redis({
        host: redisConfig.host,
        port: redisConfig.port,
        username: redisConfig.username || undefined,
        password: redisConfig.password || undefined,
        tls: redisConfig.tls,
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          return Math.min(times * 100, 3000);
        },
      });
    }

    this.redisClient.on('error', (err) => {
      this.logger.error(
        `[RedisCacheProvider] 🔌 Erro na conexão Redis: ${err.message}`,
      );
    });

    this.redisClient.on('ready', () => {
      this.logger.log(
        '[RedisCacheProvider] ✅ Conectado com SUCESSO ao servidor Redis!',
      );
    });
  }

  onModuleDestroy() {
    if (this.redisClient) {
      this.redisClient.disconnect();
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redisClient.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      this.logger.error(`Erro ao buscar cache [${key}]: ${error.message}`);
      return null; // Fallback silencioso (Circuit Breaker)
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      const data = JSON.stringify(value);
      if (ttlSeconds) {
        await this.redisClient.set(key, data, 'EX', ttlSeconds);
      } else {
        await this.redisClient.set(key, data);
      }
    } catch (error) {
      this.logger.error(`Erro ao salvar cache [${key}]: ${error.message}`);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redisClient.del(key);
    } catch (error) {
      this.logger.error(`Erro ao deletar cache [${key}]: ${error.message}`);
    }
  }

  async invalidatePrefix(prefix: string): Promise<void> {
    try {
      // Usa 'scan' para evitar travar a thread única do Redis com comandos KEYS *
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
    } catch (error) {
      this.logger.error(
        `Erro ao invalidar prefixo [${prefix}]: ${error.message}`,
      );
    }
  }
}
