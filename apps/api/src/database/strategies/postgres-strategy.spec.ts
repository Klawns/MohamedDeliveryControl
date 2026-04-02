import { ConfigService } from '@nestjs/config';
import { buildPostgresSslConfig } from './postgres-strategy';

describe('buildPostgresSslConfig', () => {
  const createConfigService = (values: Record<string, string | undefined>) =>
    ({
      get: (key: string) => values[key],
    }) as ConfigService;

  it('enables TLS by default in production', () => {
    const ssl = buildPostgresSslConfig(
      createConfigService({
        NODE_ENV: 'production',
      }),
    );

    expect(ssl).toEqual({ rejectUnauthorized: true });
  });

  it('disables TLS by default for Railway private networking', () => {
    const ssl = buildPostgresSslConfig(
      createConfigService({
        NODE_ENV: 'production',
        POSTGRES_DATABASE_URL:
          'postgresql://postgres:secret@postgres.railway.internal:5432/railway',
      }),
    );

    expect(ssl).toBe(false);
  });

  it('supports CA provided inline', () => {
    const ssl = buildPostgresSslConfig(
      createConfigService({
        NODE_ENV: 'production',
        POSTGRES_SSL_CA: 'line-1\\nline-2',
      }),
    );

    expect(ssl).toEqual({
      rejectUnauthorized: true,
      ca: 'line-1\nline-2',
    });
  });

  it('allows disabling TLS outside production', () => {
    const ssl = buildPostgresSslConfig(
      createConfigService({
        NODE_ENV: 'development',
        POSTGRES_SSL_ENABLED: 'false',
      }),
    );

    expect(ssl).toBe(false);
  });
});
