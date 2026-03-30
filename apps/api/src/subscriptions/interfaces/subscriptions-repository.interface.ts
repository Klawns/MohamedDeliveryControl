import { subscriptions } from '@mdc/database';

export type Subscription = typeof subscriptions.$inferSelect;
export type CreateSubscriptionDto = typeof subscriptions.$inferInsert;
export type UpdateSubscriptionDto = Partial<CreateSubscriptionDto>;

export const ISubscriptionsRepository = Symbol('ISubscriptionsRepository');

export interface ISubscriptionsRepository {
  findByUserId(userId: string): Promise<Subscription | undefined>;
  updateOrCreate(
    userId: string,
    plan: 'starter' | 'premium' | 'lifetime',
  ): Promise<Subscription[]>;
  overridePlan(
    userId: string,
    plan: 'starter' | 'premium' | 'lifetime',
  ): Promise<Subscription[]>;
}
