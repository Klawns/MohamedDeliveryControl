import { Injectable, Inject } from '@nestjs/common';
import { ISubscriptionsRepository } from './interfaces/subscriptions-repository.interface';

@Injectable()
export class SubscriptionsService {
  constructor(
    @Inject(ISubscriptionsRepository)
    private readonly subscriptionsRepository: ISubscriptionsRepository,
  ) { }

  async findByUserId(userId: string) {
    return this.subscriptionsRepository.findByUserId(userId);
  }

  async incrementRideCount(userId: string) {
    return this.subscriptionsRepository.incrementRideCount(userId);
  }

  async decrementRideCount(userId: string) {
    return this.subscriptionsRepository.decrementRideCount(userId);
  }

  async updateOrCreate(
    userId: string,
    plan: 'starter' | 'premium' | 'lifetime',
  ) {
    if (!userId || userId.startsWith('plan_')) {
      throw new Error(`Invalid userId: ${userId}`);
    }
    return this.subscriptionsRepository.updateOrCreate(userId, plan);
  }

  async overridePlan(
    userId: string,
    plan: 'starter' | 'premium' | 'lifetime',
  ) {
    return this.subscriptionsRepository.overridePlan(userId, plan);
  }
}
