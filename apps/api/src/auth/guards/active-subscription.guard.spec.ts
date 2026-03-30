/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument -- Jest execution-context mocks are intentionally partial. */
import { ForbiddenException } from '@nestjs/common';
import { ActiveSubscriptionGuard } from './active-subscription.guard';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';

describe('ActiveSubscriptionGuard', () => {
  let guard: ActiveSubscriptionGuard;
  let subscriptionsServiceMock: {
    getAccessSnapshot: jest.Mock;
  };

  const createContext = (user: any) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as any;

  beforeEach(() => {
    subscriptionsServiceMock = {
      getAccessSnapshot: jest.fn(),
    };

    guard = new ActiveSubscriptionGuard(
      subscriptionsServiceMock as unknown as SubscriptionsService,
    );
  });

  it('should allow admins without checking subscriptions', async () => {
    const context = createContext({ id: 'admin-1', role: 'admin' });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(subscriptionsServiceMock.getAccessSnapshot).not.toHaveBeenCalled();
  });

  it('should reject expired subscriptions', async () => {
    subscriptionsServiceMock.getAccessSnapshot.mockResolvedValue({
      status: 'expired',
      subscription: {
        id: 'sub-1',
        userId: 'user-1',
        plan: 'premium',
        status: 'active',
        rideCount: 0,
        trialStartedAt: null,
        validUntil: new Date(Date.now() - 60_000),
        createdAt: new Date(),
      },
    });

    const context = createContext({ id: 'user-1', role: 'user' });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('should attach the subscription to the request on success', async () => {
    const request = { user: { id: 'user-1', role: 'user' } };
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as any;

    subscriptionsServiceMock.getAccessSnapshot.mockResolvedValue({
      status: 'active',
      subscription: {
        id: 'sub-1',
        userId: 'user-1',
        plan: 'premium',
        status: 'active',
        rideCount: 0,
        trialStartedAt: null,
        validUntil: new Date(Date.now() + 60_000),
        createdAt: new Date(),
      },
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user.subscription).toMatchObject({
      id: 'sub-1',
      plan: 'premium',
    });
  });
});
