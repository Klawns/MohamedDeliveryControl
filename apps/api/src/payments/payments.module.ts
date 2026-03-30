import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { CacheModule } from '../cache/cache.module';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PAYMENT_PROVIDER } from './providers/payment-provider.interface';
import { PaymentProviderFactory } from './providers/payment-provider.factory';
import { DrizzlePaymentsRepository } from './repositories/drizzle-payments.repository';
import { IPaymentsRepository } from './interfaces/payments-repository.interface';

@Global()
@Module({
  imports: [ConfigModule, UsersModule, CacheModule],
  providers: [
    PaymentsService,
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
