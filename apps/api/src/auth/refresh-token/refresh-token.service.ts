import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { CACHE_PROVIDER } from '../../cache/interfaces/cache-provider.interface';
import type { ICacheProvider } from '../../cache/interfaces/cache-provider.interface';
import { randomUUID, createHash } from 'crypto';
import { z } from 'zod';

const refreshTokenPayloadSchema = z.object({
  userId: z.string().min(1),
  familyId: z.string().min(1),
});

type RefreshTokenPayload = z.infer<typeof refreshTokenPayloadSchema>;

@Injectable()
export class RefreshTokenService {
  // Definimos 15 dias de validade em segundos
  private readonly TTL_SECONDS = 15 * 24 * 60 * 60;

  constructor(
    @Inject(CACHE_PROVIDER)
    private cache: ICacheProvider,
  ) {}

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private parseTokenPayload(raw: string): RefreshTokenPayload {
    return refreshTokenPayloadSchema.parse(JSON.parse(raw) as unknown);
  }

  async create(userId: string, familyId?: string): Promise<string> {
    const token = randomUUID();
    const hashedToken = this.hashToken(token);
    const newFamilyId = familyId || randomUUID();

    const data = JSON.stringify({ userId, familyId: newFamilyId });
    await this.cache.set(
      `refresh_token:${hashedToken}`,
      data,
      this.TTL_SECONDS,
    );

    return token;
  }

  /**
   * Valida e CONSOME (remove) o token de forma atômica para evitar Race Conditions.
   * Se o token já foi consumido, dispara a detecção de reuso.
   */
  async validateAndRevoke(
    token: string,
  ): Promise<{ userId: string; familyId: string }> {
    const hashedToken = this.hashToken(token);

    // Operação Atômica: GET + DEL
    const dataRaw = await this.cache.getDel<string>(
      `refresh_token:${hashedToken}`,
    );

    if (!dataRaw) {
      // Se não existe, verificamos se foi revogado por um refresh anterior
      const compromisedFamilyId = await this.cache.get<string>(
        `revoked_token:${hashedToken}`,
      );

      if (compromisedFamilyId) {
        await this.cache.set(
          `revoked_family:${compromisedFamilyId}`,
          'true',
          this.TTL_SECONDS,
        );
        throw new UnauthorizedException(
          'Brecha de segurança detectada. Sessão invalidada por tentativa de reuso.',
        );
      }

      throw new UnauthorizedException(
        'Refresh token inválido, revogado ou expirado',
      );
    }

    const data = this.parseTokenPayload(dataRaw);

    const isFamilyRevoked = await this.cache.get<string>(
      `revoked_family:${data.familyId}`,
    );

    if (isFamilyRevoked) {
      throw new UnauthorizedException(
        'Esta sessão foi invalidada por motivos de segurança.',
      );
    }

    // Registra este token como "revogado por uso legítimo" para detectar reuso futuro
    await this.cache.set(
      `revoked_token:${hashedToken}`,
      data.familyId,
      24 * 60 * 60, // Janela de 24h para detecção
    );

    return data;
  }

  async validate(token: string): Promise<{ userId: string; familyId: string }> {
    const hashedToken = this.hashToken(token);
    const dataRaw = await this.cache.get<string>(
      `refresh_token:${hashedToken}`,
    );

    if (!dataRaw) {
      throw new UnauthorizedException(
        'Refresh token inválido, revogado ou expirado',
      );
    }

    const data = this.parseTokenPayload(dataRaw);
    const isFamilyRevoked = await this.cache.get<string>(
      `revoked_family:${data.familyId}`,
    );

    if (isFamilyRevoked) {
      throw new UnauthorizedException('Sessão comprometida.');
    }

    return data;
  }

  async revoke(token: string): Promise<void> {
    const hashedToken = this.hashToken(token);
    await this.cache.del(`refresh_token:${hashedToken}`);
  }

  // Com o Redis, o TTL nativo já apaga da memória, então o robô manual de limpeza não é mais necessário
  async cleanupExpiredTokens(): Promise<void> {
    // Obsoleto: Mantido vazio para caso seja chamado retroativamente em algum CronJob antigo.
    return Promise.resolve();
  }
}
