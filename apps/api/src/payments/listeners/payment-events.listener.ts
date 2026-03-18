import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  PaymentEvents,
  PaymentWebhookReceivedEvent,
} from '../events/payment.events';
import { WebhookJobData } from '../queue/webhook.worker';

@Injectable()
export class PaymentEventsListener {
  private readonly logger = new Logger(PaymentEventsListener.name);

  constructor(
    @InjectQueue('webhooks')
    private webhooksQueue: Queue<WebhookJobData>,
  ) {}

  @OnEvent(PaymentEvents.WEBHOOK_RECEIVED)
  async handlePaymentWebhookReceived(event: PaymentWebhookReceivedEvent) {
    this.logger.log(
      `Evento recebido: payment.webhook.received. Enfileirando Job para usuário ${event.userId}`,
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
