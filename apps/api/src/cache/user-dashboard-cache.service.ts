import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_PROVIDER } from './interfaces/cache-provider.interface';
import type { ICacheProvider } from './interfaces/cache-provider.interface';

@Injectable()
export class UserDashboardCacheService {
  private readonly logger = new Logger(UserDashboardCacheService.name);

  constructor(@Inject(CACHE_PROVIDER) private readonly cache: ICacheProvider) {}

  async invalidate(userId: string) {
    const keys = [
      `stats:${userId}:today`,
      `stats:${userId}:week`,
      `stats:${userId}:month`,
      `stats:${userId}:year`,
      `frequent-clients:${userId}`,
    ];

    await Promise.all(keys.map((key) => this.cache.del(key)));
    this.logger.debug(
      `[UserDashboardCacheService] Cache invalidado para usuário ${userId}`,
    );
  }
}
