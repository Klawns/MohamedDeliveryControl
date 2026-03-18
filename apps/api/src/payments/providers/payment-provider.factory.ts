import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AbacatePayProvider } from './abacatepay.provider';
import { StripeProvider } from './stripe.provider';
import { CaktoProvider } from './cakto.provider';
import { IPaymentProvider } from './payment-provider.interface';

@Injectable()
export class PaymentProviderFactory {
  constructor(
    private configService: ConfigService,
    private abacatePayProvider: AbacatePayProvider,
    private stripeProvider: StripeProvider,
    private caktoProvider: CaktoProvider,
  ) {}

  getProvider(): IPaymentProvider {
    const gateway =
      this.configService.get<string>('PAYMENT_GATEWAY') || 'abacatepay';

    switch (gateway.toLowerCase()) {
      case 'stripe':
        return this.stripeProvider;
      case 'cakto':
        return this.caktoProvider;
      case 'abacatepay':
      default:
        return this.abacatePayProvider;
    }
  }
}
