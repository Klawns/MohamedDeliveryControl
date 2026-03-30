import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CacheModule } from '../cache/cache.module';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { DrizzleSubscriptionsRepository } from './repositories/drizzle-subscriptions.repository';
import { ISubscriptionsRepository } from './interfaces/subscriptions-repository.interface';
import { SubscriptionWebhookWorker } from './queue/subscription-webhook.worker';
import { SubscriptionEventsListener } from './listeners/subscription-events.listener';
import { ActiveSubscriptionGuard } from '../auth/guards/active-subscription.guard';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'webhooks',
    }),
    CacheModule,
  ],
  providers: [
    SubscriptionsService,
    ActiveSubscriptionGuard,
    {
      provide: ISubscriptionsRepository,
      useClass: DrizzleSubscriptionsRepository,
    },
    SubscriptionWebhookWorker,
    SubscriptionEventsListener,
  ],
  controllers: [SubscriptionsController],
  exports: [
    SubscriptionsService,
    ISubscriptionsRepository,
    ActiveSubscriptionGuard,
  ],
})
export class SubscriptionsModule {}
