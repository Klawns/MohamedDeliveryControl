import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { IPaymentProvider, PaymentPlan } from './payment-provider.interface';

@Injectable()
export class StripeProvider implements IPaymentProvider {
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY') ||
        'sk_test_placeholder',
    );
  }

  async createCheckoutSession(
    userId: string,
    plan: PaymentPlan,
    amount: number,
    customer?: any,
    coupons?: string[],
    planName?: string,
  ) {
    const prices: any = {
      starter: null,
      premium: process.env.STRIPE_PRICE_PREMIUM_ID,
      lifetime: process.env.STRIPE_PRICE_LIFETIME_ID,
    };

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: prices[plan],
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/dashboard?payment=success`,
      cancel_url: `${process.env.FRONTEND_URL}/dashboard?payment=cancel`,
      client_reference_id: userId,
      metadata: {
        userId,
        plan,
      },
    });

    return { url: session.url as string };
  }

  async handleWebhook(signature: string, payload: Buffer, query?: any) {
    const endpointSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );
    let event: Stripe.Event;

    if (!endpointSecret) throw new Error('STRIPE_WEBHOOK_SECRET not defined');

    event = this.stripe.webhooks.constructEvent(
      payload,
      signature,
      endpointSecret,
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      return {
        received: true,
        userId: session.client_reference_id as string,
        plan: session.metadata?.plan as PaymentPlan,
      };
    }

    return { received: true };
  }
}
