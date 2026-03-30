import {
  ExecutionContext,
  Injectable,
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
}
