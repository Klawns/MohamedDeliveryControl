import { ConfigService } from '@nestjs/config';
import { PaymentProviderFactory } from './payment-provider.factory';
import { ServiceUnavailableException } from '@nestjs/common';

describe('PaymentProviderFactory', () => {
  const createConfigService = (values: Record<string, string | undefined>) =>
    ({
      get: (key: string) => values[key],
    }) as ConfigService;

  it('returns a disabled provider when PAYMENT_GATEWAY is disabled', async () => {
    const factory = new PaymentProviderFactory(
      createConfigService({
        PAYMENT_GATEWAY: 'disabled',
      }),
    );

    const provider = factory.getProvider();

    await expect(
      provider.createCheckoutSession('user-1', 'premium', 100),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('throws a clear error for unsupported providers', () => {
    const factory = new PaymentProviderFactory(
      createConfigService({
        PAYMENT_GATEWAY: 'abacatepay',
      }),
    );

    expect(() => factory.getProvider()).toThrow(
      'PAYMENT_GATEWAY=abacatepay is configured, but no payment provider implementation is registered.',
    );
  });
});
