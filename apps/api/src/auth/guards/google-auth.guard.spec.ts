/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument -- Jest execution-context mocks are intentionally partial. */
import { GoogleAuthGuard } from './google-auth.guard';
import { GoogleOAuthStateService } from '../google-oauth-state.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';

describe('GoogleAuthGuard', () => {
  let guard: GoogleAuthGuard;
  let googleOAuthStateServiceMock: {
    createFlow: jest.Mock;
    getFlowCookieOptions: jest.Mock;
  };
  let configServiceMock: {
    get: jest.Mock;
  };

  beforeEach(() => {
    googleOAuthStateServiceMock = {
      createFlow: jest.fn().mockResolvedValue({
        flowId: 'flow-id',
        state: 'oauth-state',
        oauthState: 'flow-id.oauth-state',
        plan: 'premium',
        cellphone: '11999999999',
      }),
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

    guard = new GoogleAuthGuard(
      googleOAuthStateServiceMock as unknown as GoogleOAuthStateService,
      configServiceMock as unknown as ConfigService,
    );
  });

  it('should reject the flow when google oauth is disabled', () => {
    configServiceMock.get.mockReturnValue(undefined);

    expect(() =>
      guard.canActivate({
        switchToHttp: () => ({ getRequest: jest.fn(), getResponse: jest.fn() }),
      } as any),
    ).toThrow(ServiceUnavailableException);
  });

  it('should create an oauth flow and set the flow cookie', async () => {
    const response = {
      cookie: jest.fn(),
    };
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          query: { plan: 'premium', cellphone: '(11) 99999-9999' },
        }),
        getResponse: () => response,
      }),
    } as any;

    const options = await guard.getAuthenticateOptions(context);

    expect(googleOAuthStateServiceMock.createFlow).toHaveBeenCalledWith(
      {
        plan: 'premium',
        cellphone: '11999999999',
      },
    );
    expect(response.cookie).toHaveBeenCalledWith(
      'google_oauth_flow',
      'flow-id',
      expect.objectContaining({ httpOnly: true, sameSite: 'lax' }),
    );
    expect(options).toEqual({
      scope: ['email', 'profile'],
      state: 'flow-id.oauth-state',
    });
  });

  it('should reject an invalid cellphone before starting oauth', async () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          query: { cellphone: '123' },
        }),
        getResponse: () => ({ cookie: jest.fn() }),
      }),
    } as any;

    await expect(guard.getAuthenticateOptions(context)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
