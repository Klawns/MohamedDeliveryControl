import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionWebhookWorker } from './subscription-webhook.worker';
import { SubscriptionsService } from '../subscriptions.service';
import { CACHE_PROVIDER } from '../../cache/interfaces/cache-provider.interface';

describe('SubscriptionWebhookWorker', () => {
  let worker: SubscriptionWebhookWorker;
  let subscriptionsServiceMock: any;
  let cacheProviderMock: any;

  beforeEach(async () => {
    subscriptionsServiceMock = {
      updateOrCreate: jest.fn().mockResolvedValue(undefined),
    };

    cacheProviderMock = {
      del: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionWebhookWorker,
        { provide: SubscriptionsService, useValue: subscriptionsServiceMock },
        { provide: CACHE_PROVIDER, useValue: cacheProviderMock },
      ],
    }).compile();

    worker = module.get<SubscriptionWebhookWorker>(SubscriptionWebhookWorker);
  });

  it('should be defined', () => {
    expect(worker).toBeDefined();
  });

  it('should process webhook and invalidate cache', async () => {
    const jobMock = {
      id: 'job-1',
      data: {
        userId: 'user-123',
        plan: 'premium',
        eventId: 'evt-456',
      },
    } as any;

    await worker.process(jobMock);

    expect(subscriptionsServiceMock.updateOrCreate).toHaveBeenCalledWith('user-123', 'premium');
    expect(cacheProviderMock.del).toHaveBeenCalledWith('profile:user-123');
  });

  it('should skip processing for invalid userId', async () => {
    const jobMock = {
      id: 'job-2',
      data: {
        userId: 'plan_123', // Invalid per logic
        plan: 'premium',
      },
    } as any;

    await worker.process(jobMock);

    expect(subscriptionsServiceMock.updateOrCreate).not.toHaveBeenCalled();
    expect(cacheProviderMock.del).not.toHaveBeenCalled();
  });
});
