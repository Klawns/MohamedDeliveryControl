export class PaymentWebhookReceivedEvent {
  constructor(
    public readonly userId: string,
    public readonly plan: 'starter' | 'premium' | 'lifetime',
    public readonly eventId: string,
  ) {}
}

export const PaymentEvents = {
  WEBHOOK_RECEIVED: 'payment.webhook.received',
};
