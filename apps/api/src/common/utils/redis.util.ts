import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

const logger = new Logger('RedisUtil');

export interface RedisHostConfig {
  host: string;
  port: number;
  password?: string;
  username?: string;
  tls?: Record<string, never>;
}

export type RedisConfig = string | RedisHostConfig;

export function hasRedisConfig(config: ConfigService): boolean {
  return Boolean(
    getEnvValue(config, 'REDIS_URL', 'REDISURL') ||
    getEnvValue(config, 'REDIS_HOST', 'REDISHOST'),
  );
}

function getEnvValue(
  config: ConfigService,
  primaryKey: string,
  legacyKey?: string,
): string | undefined {
  return (
    config.get<string>(primaryKey) ??
    (legacyKey ? config.get<string>(legacyKey) : undefined) ??
    process.env[primaryKey] ??
    (legacyKey ? process.env[legacyKey] : undefined)
  );
}

function getEnvPort(
  config: ConfigService,
  primaryKey: string,
  legacyKey?: string,
): string | number | undefined {
  return (
    config.get<string | number>(primaryKey) ??
    (legacyKey ? config.get<string | number>(legacyKey) : undefined) ??
    process.env[primaryKey] ??
    (legacyKey ? process.env[legacyKey] : undefined)
  );
}

export function getRedisConfig(config: ConfigService): RedisConfig {
  const redisUrl = getEnvValue(config, 'REDIS_URL', 'REDISURL');
  const host = getEnvValue(config, 'REDIS_HOST', 'REDISHOST');
  const rawPort = getEnvPort(config, 'REDIS_PORT', 'REDISPORT');
  const password = getEnvValue(config, 'REDIS_PASSWORD', 'REDISPASSWORD');
  const username = getEnvValue(config, 'REDIS_USER', 'REDISUSER');

  logger.debug(
    `[getRedisConfig] Config: URL=${!!redisUrl}, HOST=${host}, PORT=${rawPort}, ENV=${process.env.NODE_ENV}`,
  );

  if (redisUrl) {
    logger.log('[getRedisConfig] Using REDIS_URL.');
    return redisUrl;
  }

  if (host) {
    const port =
      typeof rawPort === 'string'
        ? parseInt(rawPort, 10)
        : Number(rawPort) || 6379;

    logger.log(`[getRedisConfig] Connecting to ${host}:${port}`);

    return {
      host,
      port,
      password,
      username,
      tls: port === 6380 ? {} : undefined,
    };
  }

  logger.warn(
    '[getRedisConfig] No Redis config found. Falling back to localhost.',
  );

  return {
    host: 'localhost',
    port: 6379,
  };
}
