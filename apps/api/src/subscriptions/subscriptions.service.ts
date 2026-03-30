import { Injectable, Inject, Logger } from '@nestjs/common';
import { ISubscriptionsRepository } from './interfaces/subscriptions-repository.interface';
import type { Subscription } from './interfaces/subscriptions-repository.interface';
import { CACHE_PROVIDER } from '../cache/interfaces/cache-provider.interface';
import type { ICacheProvider } from '../cache/interfaces/cache-provider.interface';

const SUBSCRIPTION_CACHE_TTL_SECONDS = 30;
const DAY_IN_MS = 24 * 60 * 60 * 1000;
export const FREE_TRIAL_DAYS = 7;
export const FREE_TRIAL_WARNING_DAYS = 2;

type SubscriptionAccessStatus =
  | 'active'
  | 'missing'
  | 'inactive'
  | 'expired'
  | 'invalid';

interface CachedSubscriptionRecord {
  subscription?: Partial<Subscription> | null;
}

export interface SubscriptionAccessSnapshot {
  status: SubscriptionAccessStatus;
  subscription?: Subscription;
  trialEndsAt: Date | null;
  trialDaysRemaining: number;
  isTrialExpiringSoon: boolean;
}

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @Inject(ISubscriptionsRepository)
    private readonly subscriptionsRepository: ISubscriptionsRepository,
    @Inject(CACHE_PROVIDER)
    private readonly cache: ICacheProvider,
  ) {}

  private getSubscriptionCacheKey(userId: string) {
    return `subscription:user:${userId}`;
  }

  private normalizeSubscription(
    subscription?: Partial<Subscription> | null,
  ): Subscription | undefined {
    if (!subscription) {
      return undefined;
    }

    return {
      ...subscription,
      createdAt: subscription.createdAt
        ? new Date(subscription.createdAt)
        : new Date(),
      trialStartedAt: subscription.trialStartedAt
        ? new Date(subscription.trialStartedAt)
        : null,
      validUntil: subscription.validUntil
        ? new Date(subscription.validUntil)
        : null,
    } as Subscription;
  }

  private getTrialStartedAt(subscription: Subscription) {
    return subscription.trialStartedAt
      ? new Date(subscription.trialStartedAt)
      : subscription.createdAt
        ? new Date(subscription.createdAt)
        : null;
  }

  private getTrialEndsAt(subscription: Subscription) {
    const trialStartedAt = this.getTrialStartedAt(subscription);

    if (!trialStartedAt) {
      return null;
    }

    return new Date(trialStartedAt.getTime() + FREE_TRIAL_DAYS * DAY_IN_MS);
  }

  private getTrialDaysRemaining(trialEndsAt: Date | null) {
    if (!trialEndsAt) {
      return 0;
    }

    const remainingMs = trialEndsAt.getTime() - Date.now();

    if (remainingMs <= 0) {
      return 0;
    }

    return Math.ceil(remainingMs / DAY_IN_MS);
  }

  private getStarterAccessSnapshot(
    subscription: Subscription,
  ): SubscriptionAccessSnapshot {
    const trialEndsAt = this.getTrialEndsAt(subscription);
    const trialDaysRemaining = this.getTrialDaysRemaining(trialEndsAt);
    const isExpired = !trialEndsAt || trialEndsAt.getTime() <= Date.now();

    return {
      status: isExpired ? 'expired' : 'active',
      subscription,
      trialEndsAt,
      trialDaysRemaining,
      isTrialExpiringSoon:
        !isExpired &&
        trialDaysRemaining > 0 &&
        trialDaysRemaining <= FREE_TRIAL_WARNING_DAYS,
    };
  }

  private isPremiumExpired(subscription: Subscription) {
    if (subscription.plan !== 'premium') {
      return false;
    }

    if (!subscription.validUntil) {
      return true;
    }

    return new Date(subscription.validUntil).getTime() <= Date.now();
  }

  private async invalidateSubscriptionCache(userId: string) {
    await this.cache.del(this.getSubscriptionCacheKey(userId));
  }

  async findByUserId(userId: string) {
    const cacheKey = this.getSubscriptionCacheKey(userId);
    const cached = await this.cache.get<CachedSubscriptionRecord>(cacheKey);

    if (cached) {
      this.logger.debug(
        `Retornando assinatura em cache para o usuário ${userId}.`,
      );
      return this.normalizeSubscription(cached.subscription);
    }

    const subscription =
      await this.subscriptionsRepository.findByUserId(userId);

    await this.cache.set(
      cacheKey,
      { subscription: subscription ?? null },
      SUBSCRIPTION_CACHE_TTL_SECONDS,
    );

    return subscription;
  }

  async getAccessSnapshot(userId: string): Promise<SubscriptionAccessSnapshot> {
    const subscription = await this.findByUserId(userId);

    if (!subscription) {
      return {
        status: 'missing',
        trialEndsAt: null,
        trialDaysRemaining: 0,
        isTrialExpiringSoon: false,
      };
    }

    if (
      subscription.status !== 'active' &&
      subscription.status !== 'trial'
    ) {
      return {
        status: 'inactive',
        subscription,
        trialEndsAt: null,
        trialDaysRemaining: 0,
        isTrialExpiringSoon: false,
      };
    }

    if (subscription.plan === 'starter') {
      return this.getStarterAccessSnapshot(subscription);
    }

    if (this.isPremiumExpired(subscription)) {
      return {
        status: subscription.validUntil ? 'expired' : 'invalid',
        subscription,
        trialEndsAt: null,
        trialDaysRemaining: 0,
        isTrialExpiringSoon: false,
      };
    }

    return {
      status: 'active',
      subscription,
      trialEndsAt: null,
      trialDaysRemaining: 0,
      isTrialExpiringSoon: false,
    };
  }

  async updateOrCreate(
    userId: string,
    plan: 'starter' | 'premium' | 'lifetime',
  ) {
    if (!userId || userId.startsWith('plan_')) {
      throw new Error(`Invalid userId: ${userId}`);
    }

    const currentSub = await this.findByUserId(userId);
    if (
      currentSub &&
      currentSub.plan === plan &&
      currentSub.status === 'active' &&
      plan !== 'premium'
    ) {
      this.logger.log(
        `Plano ${plan} já ativo para o usuário ${userId}. Ignorando atualização.`,
      );
      return currentSub;
    }

    const result = await this.subscriptionsRepository.updateOrCreate(
      userId,
      plan,
    );
    await this.invalidateSubscriptionCache(userId);
    return result;
  }

  async overridePlan(userId: string, plan: 'starter' | 'premium' | 'lifetime') {
    const result = await this.subscriptionsRepository.overridePlan(
      userId,
      plan,
    );
    await this.invalidateSubscriptionCache(userId);
    return result;
  }
}
