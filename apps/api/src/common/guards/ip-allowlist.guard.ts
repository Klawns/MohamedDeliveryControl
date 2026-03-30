/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument -- Nest execution context exposes request objects dynamically in guards. */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { normalizeIp, getClientIp } from '../utils/ip.util';

@Injectable()
export class IpAllowlistGuard implements CanActivate {
  private readonly logger = new Logger(IpAllowlistGuard.name);
  private readonly allowlist: string[];

  constructor(private configService: ConfigService) {
    const allowlistStr =
      this.configService.get<string>('DEBUG_IP_ALLOWLIST') ||
      '127.0.0.1,::1,localhost';

    this.allowlist = allowlistStr
      .split(',')
      .map((value) => value.trim())
      .map((value) => (value === 'localhost' ? '127.0.0.1' : value))
      .map((ip) => normalizeIp(ip));
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const trustProxy = request.app?.get?.('trust proxy');
    const method =
      trustProxy !== undefined && trustProxy !== false && trustProxy !== 0
        ? 'trust-proxy'
        : 'direct-socket';
    const ip = getClientIp(request);
    const isAllowed = this.allowlist.includes(ip);

    if (!isAllowed) {
      this.logger.warn(
        `[DEBUG_ACCESS] ip=${ip} method=${method} status=DENIED reason=IP_NOT_IN_ALLOWLIST`,
      );
      throw new ForbiddenException('Não autorizado.');
    }

    this.logger.log(
      `[DEBUG_ACCESS] ip=${ip} method=${method} status=IP_ALLOWED`,
    );
    return true;
  }
}
