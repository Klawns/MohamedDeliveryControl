import { validateEnv } from './env.validation';

const createValidEnv = (overrides: Record<string, unknown> = {}) => ({
  NODE_ENV: 'development',
  PORT: '3000',
  FRONTEND_URL: 'http://localhost:3000',
  DB_PROVIDER: 'postgres',
  POSTGRES_DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/rotta',
  JWT_SECRET: 'super-secret-token',
  STORAGE_TYPE: 'R2',
  R2_ACCOUNT_ID: 'account-id',
  R2_ACCESS_KEY_ID: 'access-key',
  R2_SECRET_ACCESS_KEY: 'secret-key',
  R2_BUCKET: 'bucket-name',
  R2_PUBLIC_URL: 'https://cdn.example.com',
  ...overrides,
});

describe('validateEnv', () => {
  it('accepts a valid postgres configuration', () => {
    const env = validateEnv(createValidEnv());

    expect(env.DB_PROVIDER).toBe('postgres');
    expect(env.PORT).toBe(3000);
  });

  it('rejects non-postgres providers', () => {
    expect(() =>
      validateEnv(
        createValidEnv({
          DB_PROVIDER: 'sqlite',
        }),
      ),
    ).toThrow('Invalid environment configuration');
  });

  it('rejects production without frontend url', () => {
    expect(() =>
      validateEnv(
        createValidEnv({
          NODE_ENV: 'production',
          FRONTEND_URL: '',
        }),
      ),
    ).toThrow('FRONTEND_URL');
  });

  it('rejects production without Redis configuration', () => {
    expect(() =>
      validateEnv(
        createValidEnv({
          NODE_ENV: 'production',
        }),
      ),
    ).toThrow('REDIS_URL');
  });

  it('rejects insecure postgres TLS in production', () => {
    expect(() =>
      validateEnv(
        createValidEnv({
          NODE_ENV: 'production',
          POSTGRES_DATABASE_URL:
            'postgresql://user:pass@db.example.com:5432/app',
          POSTGRES_SSL_REJECT_UNAUTHORIZED: 'false',
        }),
      ),
    ).toThrow('POSTGRES_SSL_REJECT_UNAUTHORIZED');
  });

  it('accepts bootstrap admin credentials when both are present', () => {
    const env = validateEnv(
      createValidEnv({
        ADMIN_BOOTSTRAP_EMAIL: 'admin_rotta@gmail.com',
        ADMIN_BOOTSTRAP_PASSWORD: 'senha-forte-123',
      }),
    );

    expect(env.ADMIN_BOOTSTRAP_EMAIL).toBe('admin_rotta@gmail.com');
  });

  it('rejects partial bootstrap admin configuration', () => {
    expect(() =>
      validateEnv(
        createValidEnv({
          ADMIN_BOOTSTRAP_EMAIL: 'admin_rotta@gmail.com',
        }),
      ),
    ).toThrow('ADMIN_BOOTSTRAP_EMAIL');
  });

  it('rejects weak bootstrap admin passwords', () => {
    expect(() =>
      validateEnv(
        createValidEnv({
          ADMIN_BOOTSTRAP_EMAIL: 'admin_rotta@gmail.com',
          ADMIN_BOOTSTRAP_PASSWORD: '1234567',
        }),
      ),
    ).toThrow('ADMIN_BOOTSTRAP_PASSWORD');
  });

  it('rejects partial google oauth configuration', () => {
    expect(() =>
      validateEnv(
        createValidEnv({
          GOOGLE_CLIENT_ID: 'client-id',
        }),
      ),
    ).toThrow('GOOGLE_CLIENT_ID');
  });

  it('accepts the rclone system-backup provider when the remote is configured', () => {
    const env = validateEnv(
      createValidEnv({
        SYSTEM_BACKUP_PROVIDER: 'rclone_drive',
        RCLONE_REMOTE: 'gdrive',
        PG_DUMP_BACKUP_ENABLED: 'true',
      }),
    );

    expect(env.SYSTEM_BACKUP_PROVIDER).toBe('rclone_drive');
    expect(env.RCLONE_REMOTE).toBe('gdrive');
  });

  it('rejects rclone system-backup provider without a configured remote', () => {
    expect(() =>
      validateEnv(
        createValidEnv({
          SYSTEM_BACKUP_PROVIDER: 'rclone_drive',
          RCLONE_REMOTE: '',
        }),
      ),
    ).toThrow('RCLONE_REMOTE');
  });

  it('rejects docker compose pg_dump mode without a compose service name', () => {
    expect(() =>
      validateEnv(
        createValidEnv({
          PG_DUMP_EXECUTION_MODE: 'docker_compose',
          PG_DUMP_DOCKER_COMPOSE_SERVICE: '',
        }),
      ),
    ).toThrow('PG_DUMP_DOCKER_COMPOSE_SERVICE');
  });

  it('accepts explicit system-backup failover when the secondary provider differs from the primary', () => {
    const env = validateEnv(
      createValidEnv({
        SYSTEM_BACKUP_PROVIDER: 'rclone_drive',
        RCLONE_REMOTE: 'gdrive',
        SYSTEM_BACKUP_FAILOVER_ENABLED: 'true',
        SYSTEM_BACKUP_FALLBACK_PROVIDER: 'r2',
      }),
    );

    expect(env.SYSTEM_BACKUP_FAILOVER_ENABLED).toBe('true');
    expect(env.SYSTEM_BACKUP_FALLBACK_PROVIDER).toBe('r2');
  });

  it('rejects system-backup failover when primary and fallback providers are equal', () => {
    expect(() =>
      validateEnv(
        createValidEnv({
          SYSTEM_BACKUP_PROVIDER: 'rclone_drive',
          RCLONE_REMOTE: 'gdrive',
          SYSTEM_BACKUP_FAILOVER_ENABLED: 'true',
          SYSTEM_BACKUP_FALLBACK_PROVIDER: 'rclone_drive',
        }),
      ),
    ).toThrow('SYSTEM_BACKUP_FALLBACK_PROVIDER');
  });
});
