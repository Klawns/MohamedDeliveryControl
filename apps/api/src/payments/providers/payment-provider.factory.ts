import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IPaymentProvider } from './payment-provider.interface';

class DisabledPaymentProvider implements IPaymentProvider {
  createCheckoutSession(): Promise<{ url: string }> {
    return Promise.reject(
      new ServiceUnavailableException('Payments are currently disabled.'),
    );
  }

  handleWebhook(): Promise<{
    received: boolean;
    eventId: string;
  }> {
    return Promise.reject(
      new ServiceUnavailableException('Payments are currently disabled.'),
    );
  }
}

@Injectable()
export class PaymentProviderFactory {
  private readonly logger = new Logger(PaymentProviderFactory.name);

  constructor(private configService: ConfigService) {}

  getProvider(): IPaymentProvider {
    const gateway =
      this.configService.get<string>('PAYMENT_GATEWAY')?.trim().toLowerCase() ||
      'disabled';

    if (gateway === 'disabled') {
      this.logger.warn(
        'PAYMENT_GATEWAY is disabled. Checkout and webhook endpoints will return 503.',
      );
      return new DisabledPaymentProvider();
    }

    throw new Error(
      `PAYMENT_GATEWAY=${gateway} is configured, but no payment provider implementation is registered.`,
    );
  }
}
