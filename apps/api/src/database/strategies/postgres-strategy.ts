import { DatabaseStrategy } from '../interfaces/database-strategy.interface';
import { drizzle } from 'drizzle-orm/node-postgres';
import { ConfigService } from '@nestjs/config';
import { postgresSchema as schema } from '@mdc/database';
import { Pool } from 'pg';
import type { ConnectionOptions } from 'tls';

function parseBooleanFlag(value: string | undefined, fallback: boolean) {
  if (value === undefined) {
    return fallback;
  }

  return value === 'true';
}

function decodeMultilineValue(
  inlineValue?: string,
  base64Value?: string,
): string | undefined {
  if (inlineValue) {
    return inlineValue.replace(/\\n/g, '\n');
  }

  if (!base64Value) {
    return undefined;
  }

  return Buffer.from(base64Value, 'base64').toString('utf8');
}

function resolvePostgresHost(configService: ConfigService): string | undefined {
  const explicitHost = configService.get<string>('PGHOST');

  if (explicitHost) {
    return explicitHost;
  }

  const connectionString = configService.get<string>('DATABASE_URL');

  if (!connectionString) {
    return undefined;
  }

  try {
    return new URL(connectionString).hostname;
  } catch {
    return undefined;
  }
}

export function buildPostgresSslConfig(
  configService: ConfigService,
): ConnectionOptions | false {
  const isProduction = configService.get<string>('NODE_ENV') === 'production';
  const host = resolvePostgresHost(configService);
  const shouldDefaultToSsl = isProduction && !host?.endsWith('.railway.internal');
  const sslEnabled = parseBooleanFlag(
    configService.get<string>('POSTGRES_SSL_ENABLED'),
    shouldDefaultToSsl,
  );

  if (!sslEnabled) {
    return false;
  }

  const sslConfig: ConnectionOptions = {
    rejectUnauthorized: parseBooleanFlag(
      configService.get<string>('POSTGRES_SSL_REJECT_UNAUTHORIZED'),
      true,
    ),
  };

  const ca = decodeMultilineValue(
    configService.get<string>('POSTGRES_SSL_CA'),
    configService.get<string>('POSTGRES_SSL_CA_BASE64'),
  );
  const cert = decodeMultilineValue(
    configService.get<string>('POSTGRES_SSL_CERT'),
    configService.get<string>('POSTGRES_SSL_CERT_BASE64'),
  );
  const key = decodeMultilineValue(
    configService.get<string>('POSTGRES_SSL_KEY'),
    configService.get<string>('POSTGRES_SSL_KEY_BASE64'),
  );

  if (ca) {
    sslConfig.ca = ca;
  }

  if (cert) {
    sslConfig.cert = cert;
  }

  if (key) {
    sslConfig.key = key;
  }

  return sslConfig;
}

export class PostgresStrategy implements DatabaseStrategy {
  constructor(private readonly configService: ConfigService) {}

  connect(): Promise<any> {
    const connectionString = this.configService.get<string>('DATABASE_URL');

    // Alternatively, use detailed vars if URL is not provided
    const user =
      this.configService.get<string>('POSTGRES_USER') ||
      this.configService.get<string>('PGUSER');
    const password =
      this.configService.get<string>('POSTGRES_PASSWORD') ||
      this.configService.get<string>('PGPASSWORD');
    const host = this.configService.get<string>('PGHOST') || 'localhost';
    const port = this.configService.get<number>('PGPORT') || 5432;
    const database =
      this.configService.get<string>('POSTGRES_DB') ||
      this.configService.get<string>('PGDATABASE');

    const pool = new Pool({
      connectionString,
      user,
      password,
      host,
      port,
      database,
      ssl: buildPostgresSslConfig(this.configService),
    });

    return Promise.resolve(drizzle(pool, { schema }));
  }
}
