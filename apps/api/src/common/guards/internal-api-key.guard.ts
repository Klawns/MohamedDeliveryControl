/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument -- Nest execution context exposes request objects dynamically in guards. */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { getClientIp } from '../utils/ip.util';

@Injectable()
export class InternalApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(InternalApiKeyGuard.name);

  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const ip = getClientIp(request);

    // Tratamento seguro do header: pode ser string, string[] ou undefined
    const apiKeyHeader = request.headers['x-internal-debug-key'];
    const apiKey = Array.isArray(apiKeyHeader)
      ? apiKeyHeader[0]
      : apiKeyHeader || '';

    const internalApiKey = this.configService.get<string>('INTERNAL_DEBUG_KEY');

    if (!internalApiKey || internalApiKey.length < 16) {
      this.logger.error(
        `[DEBUG_ACCESS] ip=${ip} status=DENIED reason=INSECURE_SERVER_CONFIG`,
      );
      throw new UnauthorizedException('Não autorizado.');
    }

    const isKeyValid = this.safeCompare(apiKey, internalApiKey);

    if (!isKeyValid) {
      this.logger.warn(
        `[DEBUG_ACCESS] ip=${ip} status=DENIED reason=INVALID_KEY`,
      );
      throw new UnauthorizedException('Não autorizado.');
    }

    return true;
  }

  private safeCompare(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);

    if (bufA.length !== bufB.length) return false;

    return crypto.timingSafeEqual(bufA, bufB);
  }
}
