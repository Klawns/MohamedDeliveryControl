import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { CACHE_PROVIDER } from '../cache/interfaces/cache-provider.interface';
import type { ICacheProvider } from '../cache/interfaces/cache-provider.interface';

const GOOGLE_OAUTH_STATE_TTL_SECONDS = 600;
export const GOOGLE_OAUTH_FLOW_COOKIE = 'google_oauth_flow';

type GoogleOAuthPlan = 'starter' | 'premium' | 'lifetime';

interface GoogleOAuthFlowInput {
  plan?: string;
  cellphone?: string;
}

export interface GoogleOAuthFlowRecord {
  flowId: string;
  state: string;
  plan: GoogleOAuthPlan;
  cellphone?: string;
}

@Injectable()
export class GoogleOAuthStateService {
  constructor(
    @Inject(CACHE_PROVIDER)
    private readonly cache: ICacheProvider,
    private readonly configService: ConfigService,
  ) {}

  private getFlowCacheKey(flowId: string) {
    return `oauth:google:flow:${flowId}`;
  }

  private encodeState(flowId: string, state: string) {
    return `${flowId}.${state}`;
  }

  private parseState(state?: string) {
    if (!state) {
      return null;
    }

    const [flowId, stateToken, ...rest] = state.split('.');

    if (!flowId || !stateToken || rest.length > 0) {
      return null;
    }

    return {
      flowId,
      state: stateToken,
    };
  }

  private isProduction() {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');

    return (
      process.env.NODE_ENV === 'production' ||
      frontendUrl?.includes('up.railway.app')
    );
  }

  normalizePlan(plan?: string): GoogleOAuthPlan {
    if (plan === 'premium' || plan === 'lifetime') {
      return plan;
    }

    return 'starter';
  }

  getFlowCookieOptions() {
    return {
      httpOnly: true,
      secure: this.isProduction(),
      sameSite: 'lax' as const,
      domain: this.configService.get<string>('COOKIE_DOMAIN') || undefined,
      path: '/',
      maxAge: GOOGLE_OAUTH_STATE_TTL_SECONDS * 1000,
    };
  }

  async createFlow(input: GoogleOAuthFlowInput = {}) {
    const flowId = randomBytes(24).toString('base64url');
    const state = randomBytes(32).toString('base64url');
    const normalizedPlan = this.normalizePlan(input.plan);
    const flowRecord: GoogleOAuthFlowRecord = {
      flowId,
      state,
      plan: normalizedPlan,
      ...(input.cellphone ? { cellphone: input.cellphone } : {}),
    };

    await this.cache.set(
      this.getFlowCacheKey(flowId),
      flowRecord,
      GOOGLE_OAUTH_STATE_TTL_SECONDS,
    );

    return {
      ...flowRecord,
      oauthState: this.encodeState(flowId, state),
    };
  }

  async consumeFlow(flowId?: string, providedState?: string) {
    const parsedState = this.parseState(providedState);

    if (!parsedState) {
      return null;
    }

    if (flowId && flowId !== parsedState.flowId) {
      return null;
    }

    const effectiveFlowId = flowId ?? parsedState.flowId;
    const flow = await this.cache.getDel<GoogleOAuthFlowRecord>(
      this.getFlowCacheKey(effectiveFlowId),
    );

    if (!flow || flow.state !== parsedState.state) {
      return null;
    }

    return flow;
  }
}
