/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument -- Jest execution-context mocks are intentionally partial. */
import {
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { GoogleCallbackGuard } from './google-callback.guard';
import { GoogleOAuthStateService } from '../google-oauth-state.service';
import { ConfigService } from '@nestjs/config';

describe('GoogleCallbackGuard', () => {
  let guard: GoogleCallbackGuard;
  let googleOAuthStateServiceMock: {
    consumeFlow: jest.Mock;
    getFlowCookieOptions: jest.Mock;
  };
  let configServiceMock: {
    get: jest.Mock;
  };

  beforeEach(() => {
    googleOAuthStateServiceMock = {
      consumeFlow: jest.fn(),
      getFlowCookieOptions: jest.fn().mockReturnValue({
        httpOnly: true,
        sameSite: 'lax',
      }),
    };
    configServiceMock = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          GOOGLE_CLIENT_ID: 'client-id',
          GOOGLE_CLIENT_SECRET: 'client-secret',
          GOOGLE_CALLBACK_URL: 'http://localhost:3000/auth/google/callback',
        };

        return values[key];
      }),
    };

    guard = new GoogleCallbackGuard(
      googleOAuthStateServiceMock as unknown as GoogleOAuthStateService,
      configServiceMock as unknown as ConfigService,
    );
  });

  it('should reject the callback when google oauth is disabled', async () => {
    configServiceMock.get.mockReturnValue(undefined);

    await expect(
      guard.canActivate({
        switchToHttp: () => ({
          getRequest: () => ({ cookies: {}, query: {} }),
          getResponse: () => ({ clearCookie: jest.fn() }),
        }),
      } as any),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('should reject invalid oauth flows before passport exchange', async () => {
    googleOAuthStateServiceMock.consumeFlow.mockResolvedValueOnce(null);
    const response = { clearCookie: jest.fn() };
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          cookies: { google_oauth_flow: 'flow-id' },
          query: { state: 'bad-state' },
        }),
        getResponse: () => response,
      }),
    } as any;

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(response.clearCookie).toHaveBeenCalledWith(
      'google_oauth_flow',
      expect.objectContaining({ httpOnly: true, sameSite: 'lax' }),
    );
  });

  it('should attach the validated flow and continue to passport', async () => {
    googleOAuthStateServiceMock.consumeFlow.mockResolvedValueOnce({
      flowId: 'flow-id',
      state: 'oauth-state',
      plan: 'premium',
      cellphone: '11999999999',
    });

    const parentCanActivate = jest
      .spyOn(
        Object.getPrototypeOf(GoogleCallbackGuard.prototype),
        'canActivate',
      )
      .mockResolvedValue(true as never);

    const request = {
      cookies: { google_oauth_flow: 'flow-id' },
      query: { state: 'oauth-state' },
    };
    const response = { clearCookie: jest.fn() };
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as any;

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request).toMatchObject({
      googleOAuthFlow: {
        flowId: 'flow-id',
        state: 'oauth-state',
        plan: 'premium',
        cellphone: '11999999999',
      },
    });

    parentCanActivate.mockRestore();
  });
});
