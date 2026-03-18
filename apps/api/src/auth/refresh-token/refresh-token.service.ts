import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { CACHE_PROVIDER } from '../../cache/interfaces/cache-provider.interface';
import type { ICacheProvider } from '../../cache/interfaces/cache-provider.interface';
import { randomUUID } from 'crypto';

@Injectable()
export class RefreshTokenService {
  // Definimos 15 dias de validade em segundos
  private readonly TTL_SECONDS = 15 * 24 * 60 * 60;

  constructor(
    @Inject(CACHE_PROVIDER)
    private cache: ICacheProvider,
  ) {}

  async create(userId: string): Promise<string> {
    const token = randomUUID();

    // Salvamos o token no Redis com a chave 'refresh_token:<token>'
    // O valor associado é o ID do usuário
    await this.cache.set(`refresh_token:${token}`, userId, this.TTL_SECONDS);

    return token;
  }

  async validate(token: string): Promise<{ userId: string }> {
    const userId = await this.cache.get<string>(`refresh_token:${token}`);

    if (!userId) {
      throw new UnauthorizedException(
        'Refresh token inválido, revogado ou expirado',
      );
    }

    return { userId };
  }

  async revoke(token: string): Promise<void> {
    await this.cache.del(`refresh_token:${token}`);
  }

  // Com o Redis, o TTL nativo já apaga da memória, então o robô manual de limpeza não é mais necessário
  async cleanupExpiredTokens(): Promise<void> {
    // Obsoleto: Mantido vazio para caso seja chamado retroativamente em algum CronJob antigo.
    return Promise.resolve();
  }
}
