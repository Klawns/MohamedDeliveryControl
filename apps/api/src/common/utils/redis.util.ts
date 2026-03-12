import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

const logger = new Logger('RedisUtil');

export function getRedisConfig(config: ConfigService) {
    // Tenta primeiro via ConfigService (Abstração padrão Nest)
    let redisUrl = config.get<string>('REDIS_URL') || config.get<string>('REDISURL');
    let host = config.get<string>('REDISHOST');
    let rawPort = config.get<string | number>('REDISPORT');
    let password = config.get<string>('REDISPASSWORD');
    let username = config.get<string>('REDISUSER');

    // Redundância direta process.env (Útil se o ConfigService ainda não carregou arquivos ou em certas versões de container)
    if (!redisUrl && !host) {
        redisUrl = process.env.REDIS_URL || process.env.REDISURL;
        host = process.env.REDISHOST;
        rawPort = process.env.REDISPORT;
        password = process.env.REDISPASSWORD;
        username = process.env.REDISUSER;

        if (redisUrl || host) {
            logger.debug(`[getRedisConfig] ⚡ Variáveis detectadas via process.env (Backup)`);
        }
    }

    logger.debug(`[getRedisConfig] Config: URL=${!!redisUrl}, HOST=${host}, PORT=${rawPort}, ENV=${process.env.NODE_ENV}`);

    if (redisUrl) {
        logger.log(`[getRedisConfig] ✅ Usando REDIS_URL.`);
        return redisUrl;
    }

    if (host) {
        const port = typeof rawPort === 'string' ? parseInt(rawPort, 10) : (Number(rawPort) || 6379);
        logger.log(`[getRedisConfig] ✅ Conectando em ${host}:${port}`);
        return {
            host,
            port,
            password,
            username,
            tls: (port === 6380 || (typeof redisUrl === 'string' && redisUrl.startsWith('rediss:'))) ? {} : undefined,
        };
    }

    logger.warn(`[getRedisConfig] ⚠️ Nenhuma configuração encontrada. Usando localhost.`);
    return {
        host: 'localhost',
        port: 6379,
        password: undefined,
        username: undefined,
        tls: undefined,
    };
}
