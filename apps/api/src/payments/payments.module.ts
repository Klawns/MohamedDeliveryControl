import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { CacheModule } from '../cache/cache.module';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PAYMENT_PROVIDER } from './providers/payment-provider.interface';
import { AbacatePayProvider } from './providers/abacatepay.provider';
import { StripeProvider } from './providers/stripe.provider';
import { CaktoProvider } from './providers/cakto.provider';
import { PaymentProviderFactory } from './providers/payment-provider.factory';
import { DrizzlePaymentsRepository } from './repositories/drizzle-payments.repository';
import { IPaymentsRepository } from './interfaces/payments-repository.interface';

@Module({
  imports: [
    ConfigModule,
    UsersModule,
    CacheModule,
  ],
  providers: [
    PaymentsService,
    AbacatePayProvider,
    StripeProvider,
    CaktoProvider,
    PaymentProviderFactory,
    {
      provide: PAYMENT_PROVIDER,
      useFactory: (factory: PaymentProviderFactory) => factory.getProvider(),
      inject: [PaymentProviderFactory],
    },
    {
      provide: IPaymentsRepository,
      useClass: DrizzlePaymentsRepository,
    },
  ],
  controllers: [PaymentsController],
  exports: [PaymentsService, PAYMENT_PROVIDER, IPaymentsRepository],
})
export class PaymentsModule {}
