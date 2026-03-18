import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CacheModule } from '../cache/cache.module';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { DrizzleSubscriptionsRepository } from './repositories/drizzle-subscriptions.repository';
import { ISubscriptionsRepository } from './interfaces/subscriptions-repository.interface';
import { SubscriptionWebhookWorker } from './queue/subscription-webhook.worker';
import { SubscriptionEventsListener } from './listeners/subscription-events.listener';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'webhooks',
    }),
    CacheModule,
  ],
  providers: [
    SubscriptionsService,
    {
      provide: ISubscriptionsRepository,
      useClass: DrizzleSubscriptionsRepository,
    },
    SubscriptionWebhookWorker,
    SubscriptionEventsListener,
  ],
  controllers: [SubscriptionsController],
  exports: [SubscriptionsService, ISubscriptionsRepository],
})
export class SubscriptionsModule {}
