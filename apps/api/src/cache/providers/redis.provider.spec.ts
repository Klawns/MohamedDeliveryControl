import { ConfigService } from '@nestjs/config';
import { RedisCacheProvider } from './redis.provider';

const redisConstructorMock = jest.fn();

jest.mock('ioredis', () => ({
  Redis: jest.fn().mockImplementation((...args: unknown[]) => {
    redisConstructorMock(...args);
    return createRedisClientMock();
  }),
}));

function createRedisClientMock() {
  return {
    on: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    call: jest.fn(),
    scan: jest.fn(),
    disconnect: jest.fn(),
  };
}

function createConfigService(values: Record<string, string | undefined>) {
  return {
    get: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService;
}

describe('RedisCacheProvider', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'test';
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('fails fast in production when Redis is not configured', () => {
    process.env.NODE_ENV = 'production';
    const provider = new RedisCacheProvider(createConfigService({}));

    expect(() => provider.onModuleInit()).toThrow('Redis');
  });

  it('does not persist writes in local memory after a Redis write failure in production', async () => {
    process.env.NODE_ENV = 'production';
    const provider = new RedisCacheProvider(
      createConfigService({
        REDIS_URL: 'redis://cache.example.com:6379',
      }),
    );

    provider.onModuleInit();

    const redisClient = (
      provider as unknown as {
        redisClient: ReturnType<typeof createRedisClientMock>;
      }
    ).redisClient;

    redisClient.set.mockRejectedValueOnce(new Error('redis down'));
    redisClient.get.mockResolvedValueOnce(null);

    await expect(
      provider.set('profile:user-1', { name: 'Alice' }),
    ).rejects.toThrow('redis down');
    await expect(provider.get('profile:user-1')).resolves.toBeNull();
  });

  it('surfaces Redis read failures in production instead of switching to process-local state', async () => {
    process.env.NODE_ENV = 'production';
    const provider = new RedisCacheProvider(
      createConfigService({
        REDIS_URL: 'redis://cache.example.com:6379',
      }),
    );

    provider.onModuleInit();

    const redisClient = (
      provider as unknown as {
        redisClient: ReturnType<typeof createRedisClientMock>;
      }
    ).redisClient;

    redisClient.get.mockRejectedValueOnce(new Error('redis read failed'));

    await expect(provider.get('subscription:user:user-1')).rejects.toThrow(
      'redis read failed',
    );
  });

  it('keeps development fallback behavior when Redis is not configured', async () => {
    process.env.NODE_ENV = 'development';
    const provider = new RedisCacheProvider(createConfigService({}));

    provider.onModuleInit();

    await provider.set('profile:user-1', { name: 'Alice' }, 60);

    await expect(provider.get('profile:user-1')).resolves.toEqual({
      name: 'Alice',
    });
  });
});
