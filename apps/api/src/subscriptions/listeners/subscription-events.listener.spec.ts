import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionEventsListener } from './subscription-events.listener';
import { getQueueToken } from '@nestjs/bullmq';
import { PaymentEvents } from '../../payments/events/payment.events';

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

    listener = module.get<SubscriptionEventsListener>(SubscriptionEventsListener);
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
