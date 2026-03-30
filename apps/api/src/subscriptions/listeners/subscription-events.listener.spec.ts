/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument -- Jest event-emitter mocks are intentionally partial. */
import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionEventsListener } from './subscription-events.listener';
import { getQueueToken } from '@nestjs/bullmq';

describe('SubscriptionEventsListener', () => {
  let listener: SubscriptionEventsListener;
  let queueMock: any;

  beforeEach(async () => {
    queueMock = {
      add: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionEventsListener,
        {
          provide: getQueueToken('webhooks'),
          useValue: queueMock,
        },
      ],
    }).compile();

    listener = module.get<SubscriptionEventsListener>(
      SubscriptionEventsListener,
    );
  });

  it('should be defined', () => {
    expect(listener).toBeDefined();
  });

  it('should enqueue a job when payment webhook received', async () => {
    const event = {
      userId: 'user-123',
      plan: 'premium',
      eventId: 'evt-456',
    };

    await listener.handlePaymentWebhookReceived(event as any);

    expect(queueMock.add).toHaveBeenCalledWith(
      'process-payment',
      {
        userId: 'user-123',
        plan: 'premium',
        eventId: 'evt-456',
      },
      expect.any(Object),
    );
  });
});
