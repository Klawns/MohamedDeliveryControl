import {
  BadRequestException,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import {
  GOOGLE_OAUTH_FLOW_COOKIE,
  GoogleOAuthStateService,
} from '../google-oauth-state.service';
import { googleOAuthStartQuerySchema } from '../dto/auth.dto';
import { isGoogleOAuthConfigured } from '../google.strategy';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor(
    private readonly googleOAuthStateService: GoogleOAuthStateService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  canActivate(context: ExecutionContext) {
    if (!isGoogleOAuthConfigured(this.configService)) {
      throw new ServiceUnavailableException(
        'Google OAuth is not configured for this environment.',
      );
    }

    return super.canActivate(context);
  }

  async getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<
      Request & {
        query: Record<string, unknown>;
      }
    >();
    const response = context.switchToHttp().getResponse<Response>();
    const parsedQuery = googleOAuthStartQuerySchema.safeParse(request.query);

    if (!parsedQuery.success) {
      throw new BadRequestException(
        parsedQuery.error.issues[0]?.message ??
          'Parâmetros inválidos para autenticação com Google.',
      );
    }

    const flow = await this.googleOAuthStateService.createFlow(parsedQuery.data);

    response.cookie(
      GOOGLE_OAUTH_FLOW_COOKIE,
      flow.flowId,
      this.googleOAuthStateService.getFlowCookieOptions(),
    );

    return {
      scope: ['email', 'profile'],
      state: flow.oauthState,
    };
  }
}
