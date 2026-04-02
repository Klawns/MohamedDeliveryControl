/* eslint-disable @typescript-eslint/unbound-method -- Jest assertions intentionally reference mock methods directly. */
import { ConfigService } from '@nestjs/config';
import { GoogleOAuthStateService } from './google-oauth-state.service';
import type { ICacheProvider } from '../cache/interfaces/cache-provider.interface';

describe('GoogleOAuthStateService', () => {
  let service: GoogleOAuthStateService;
  let cacheMock: jest.Mocked<ICacheProvider>;

  beforeEach(() => {
    cacheMock = {
      get: jest.fn(),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
      getDel: jest.fn(),
      invalidatePrefix: jest.fn().mockResolvedValue(undefined),
    };

    service = new GoogleOAuthStateService(cacheMock, {
      get: jest.fn((key: string) => {
        if (key === 'COOKIE_DOMAIN') {
          return undefined;
        }

        if (key === 'FRONTEND_URL') {
          return 'http://localhost:3000';
        }

        return undefined;
      }),
    } as unknown as ConfigService);
  });

  it('should normalize unsupported plans to starter', async () => {
    const flow = await service.createFlow({ plan: 'weird-plan' });

    expect(flow.plan).toBe('starter');
    expect(cacheMock.set).toHaveBeenCalledWith(
      expect.stringMatching(/^oauth:google:flow:/),
      expect.objectContaining({
        flowId: flow.flowId,
        plan: 'starter',
        state: flow.state,
      }),
      600,
    );
    expect(flow.oauthState).toBe(`${flow.flowId}.${flow.state}`);
  });

  it('should return null when the flow state does not match', async () => {
    cacheMock.getDel.mockResolvedValueOnce({
      flowId: 'flow-id',
      state: 'expected-state',
      plan: 'premium',
    });

    const result = await service.consumeFlow('flow-id', 'flow-id.wrong-state');

    expect(result).toBeNull();
  });

  it('should consume a valid flow once', async () => {
    cacheMock.getDel.mockResolvedValueOnce({
      flowId: 'flow-id',
      state: 'expected-state',
      plan: 'premium',
    });

    const result = await service.consumeFlow(
      'flow-id',
      'flow-id.expected-state',
    );

    expect(result).toEqual({
      flowId: 'flow-id',
      state: 'expected-state',
      plan: 'premium',
    });
    expect(cacheMock.getDel).toHaveBeenCalledWith('oauth:google:flow:flow-id');
  });

  it('should consume a valid flow even when the cookie is missing', async () => {
    cacheMock.getDel.mockResolvedValueOnce({
      flowId: 'flow-id',
      state: 'expected-state',
      plan: 'starter',
    });

    const result = await service.consumeFlow(
      undefined,
      'flow-id.expected-state',
    );

    expect(result).toEqual({
      flowId: 'flow-id',
      state: 'expected-state',
      plan: 'starter',
    });
  });

  it('should persist the cellphone in the oauth flow when provided', async () => {
    const flow = await service.createFlow({
      plan: 'premium',
      cellphone: '11999999999',
    });

    expect(cacheMock.set).toHaveBeenCalledWith(
      expect.stringMatching(/^oauth:google:flow:/),
      expect.objectContaining({
        flowId: flow.flowId,
        plan: 'premium',
        cellphone: '11999999999',
      }),
      600,
    );
  });
});
