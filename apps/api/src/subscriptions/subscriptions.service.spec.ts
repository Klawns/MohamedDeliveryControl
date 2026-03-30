import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionsService } from './subscriptions.service';
import {
  ISubscriptionsRepository,
  Subscription,
} from './interfaces/subscriptions-repository.interface';
import { CACHE_PROVIDER } from '../cache/interfaces/cache-provider.interface';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let repoMock: {
    findByUserId: jest.Mock;
    updateOrCreate: jest.Mock;
    overridePlan: jest.Mock;
  };
  let cacheMock: {
    get: jest.Mock;
    set: jest.Mock;
    del: jest.Mock;
  };

  const premiumSubscription: Subscription = {
    id: 'sub-1',
    userId: 'user-1',
    plan: 'premium',
    status: 'active',
    rideCount: 0,
    trialStartedAt: null,
    validUntil: new Date(Date.now() + 60_000),
    createdAt: new Date(),
  };

  beforeEach(async () => {
    repoMock = {
      findByUserId: jest.fn(),
      updateOrCreate: jest.fn().mockResolvedValue([premiumSubscription]),
      overridePlan: jest.fn().mockResolvedValue([premiumSubscription]),
    };

    cacheMock = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        { provide: ISubscriptionsRepository, useValue: repoMock },
        { provide: CACHE_PROVIDER, useValue: cacheMock },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should cache subscription lookups after a cache miss', async () => {
    repoMock.findByUserId.mockResolvedValueOnce(premiumSubscription);

    const result = await service.findByUserId('user-1');

    expect(result).toEqual(premiumSubscription);
    expect(repoMock.findByUserId).toHaveBeenCalledWith('user-1');
    expect(cacheMock.set).toHaveBeenCalledWith(
      'subscription:user:user-1',
      { subscription: premiumSubscription },
      30,
    );
  });

  it('should return cached subscription without hitting the repository', async () => {
    cacheMock.get.mockResolvedValueOnce({
      subscription: {
        ...premiumSubscription,
        validUntil: premiumSubscription.validUntil?.toISOString(),
        createdAt: premiumSubscription.createdAt.toISOString(),
      },
    });

    const result = await service.findByUserId('user-1');

    expect(repoMock.findByUserId).not.toHaveBeenCalled();
    expect(result?.validUntil).toBeInstanceOf(Date);
    expect(result?.createdAt).toBeInstanceOf(Date);
  });

  it('should mark a premium subscription as expired when validUntil is in the past', async () => {
    repoMock.findByUserId.mockResolvedValueOnce({
      ...premiumSubscription,
      validUntil: new Date(Date.now() - 60_000),
    });

    const result = await service.getAccessSnapshot('user-1');

    expect(result.status).toBe('expired');
    expect(result.trialDaysRemaining).toBe(0);
  });

  it('should treat premium without validUntil as invalid', async () => {
    repoMock.findByUserId.mockResolvedValueOnce({
      ...premiumSubscription,
      validUntil: null,
    });

    const result = await service.getAccessSnapshot('user-1');

    expect(result.status).toBe('invalid');
  });

  it('should not skip premium updates because renewals extend validUntil', async () => {
    repoMock.findByUserId.mockResolvedValueOnce(premiumSubscription);

    await service.updateOrCreate('user-1', 'premium');

    expect(repoMock.updateOrCreate).toHaveBeenCalledWith('user-1', 'premium');
    expect(cacheMock.del).toHaveBeenCalledWith('subscription:user:user-1');
  });

  it('should skip redundant starter updates and avoid repository writes', async () => {
    repoMock.findByUserId.mockResolvedValueOnce({
      ...premiumSubscription,
      plan: 'starter',
      trialStartedAt: new Date(),
      validUntil: null,
    });

    const result = await service.updateOrCreate('user-1', 'starter');

    expect(repoMock.updateOrCreate).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      userId: 'user-1',
      plan: 'starter',
      status: 'active',
    });
  });

  it('should calculate remaining days for an active starter trial', async () => {
    repoMock.findByUserId.mockResolvedValueOnce({
      ...premiumSubscription,
      plan: 'starter',
      trialStartedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      validUntil: null,
    });

    const result = await service.getAccessSnapshot('user-1');

    expect(result.status).toBe('active');
    expect(result.trialDaysRemaining).toBeGreaterThan(0);
  });
});
