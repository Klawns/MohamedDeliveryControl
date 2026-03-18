import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  PaymentEvents,
  PaymentWebhookReceivedEvent,
} from '../../payments/events/payment.events';
import { WebhookJobData } from '../queue/subscription-webhook.worker';

@Injectable()
export class SubscriptionEventsListener {
  private readonly logger = new Logger(SubscriptionEventsListener.name);

  constructor(
    @InjectQueue('webhooks')
    private webhooksQueue: Queue<WebhookJobData>,
  ) {}

  @OnEvent(PaymentEvents.WEBHOOK_RECEIVED)
  async handlePaymentWebhookReceived(event: PaymentWebhookReceivedEvent) {
    this.logger.log(
      `Evento EDA Recebido: payment.webhook.received. Enfileirando Job de Assinatura para usuário ${event.userId}`,
    );

    await this.webhooksQueue.add(
      'process-payment',
      {
        userId: event.userId,
        plan: event.plan,
        eventId: event.eventId,
      },
      {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: true,
      },
    );
  }
}
