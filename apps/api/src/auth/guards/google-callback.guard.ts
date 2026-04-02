import {
  BadRequestException,
  ExecutionContext,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import {
  GOOGLE_OAUTH_FLOW_COOKIE,
  type GoogleOAuthFlowRecord,
  GoogleOAuthStateService,
} from '../google-oauth-state.service';
import { isGoogleOAuthConfigured } from '../google.strategy';

type GoogleCallbackRequest = {
  cookies?: Record<string, string | undefined>;
  query: Record<string, unknown>;
  googleOAuthFlow?: GoogleOAuthFlowRecord;
};

@Injectable()
export class GoogleCallbackGuard extends AuthGuard('google') {
  private readonly logger = new Logger(GoogleCallbackGuard.name);

  constructor(
    private readonly googleOAuthStateService: GoogleOAuthStateService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!isGoogleOAuthConfigured(this.configService)) {
      throw new ServiceUnavailableException(
        'Google OAuth is not configured for this environment.',
      );
    }

    const request = context.switchToHttp().getRequest<GoogleCallbackRequest>();
    const response = context.switchToHttp().getResponse<Response>();
    const flow = await this.googleOAuthStateService.consumeFlow(
      request.cookies?.[GOOGLE_OAUTH_FLOW_COOKIE],
      typeof request.query?.state === 'string'
        ? request.query.state
        : undefined,
    );

    response.clearCookie(
      GOOGLE_OAUTH_FLOW_COOKIE,
      this.googleOAuthStateService.getFlowCookieOptions(),
    );

    if (!flow) {
      throw new UnauthorizedException('Fluxo OAuth inválido ou expirado.');
    }

    request.googleOAuthFlow = flow;

    return super.canActivate(context) as Promise<boolean>;
  }

  handleRequest<TUser = unknown>(
    err: unknown,
    user: TUser,
    info?: unknown,
  ): TUser {
    if (err) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === 'string'
            ? err
            : 'erro desconhecido';
      this.logger.error(
        `Falha ao concluir o callback do Google. Verifique GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET e GOOGLE_CALLBACK_URL. Motivo: ${message}`,
        err instanceof Error ? err.stack : undefined,
      );

      throw new BadRequestException(
        'Falha ao concluir autenticação com Google.',
      );
    }

    if (!user) {
      const message =
        info instanceof Error
          ? info.message
          : typeof info === 'string'
            ? info
            : 'usuario ausente no retorno do Passport';

      this.logger.warn(
        `Google OAuth rejeitado sem usuario autenticado. Motivo: ${message}`,
      );

      throw new UnauthorizedException('Falha ao autenticar com Google.');
    }

    return user;
  }
}
