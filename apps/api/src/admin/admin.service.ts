import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PAYMENT_PROVIDER } from '../payments/providers/payment-provider.interface';
import type { IPaymentProvider } from '../payments/providers/payment-provider.interface';
import { IAdminRepository } from './interfaces/admin-repository.interface';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { CACHE_PROVIDER } from '../cache/interfaces/cache-provider.interface';
import type { ICacheProvider } from '../cache/interfaces/cache-provider.interface';
import { IPaymentsRepository } from '../payments/interfaces/payments-repository.interface';
import type { PricingPlanUpdate } from './interfaces/admin-settings-repository.interface';
import type { RecentAdminUser } from './interfaces/admin-repository.interface';
import type { PaymentPlanId } from '../payments/pricing-plan-catalog';

import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import type { CreateUserDto } from '../users/interfaces/users-repository.interface';

@Injectable()
export class AdminService {
  constructor(
    @Inject(IAdminRepository)
    private readonly adminRepository: IAdminRepository,
    @Inject(PAYMENT_PROVIDER)
    private readonly paymentProvider: IPaymentProvider,
    @Inject(IPaymentsRepository)
    private readonly paymentsRepository: IPaymentsRepository,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    @Inject(CACHE_PROVIDER)
    private readonly cache: ICacheProvider,
  ) {}

  private get adminEmail() {
    return (
      this.configService.get<string>('ADMIN_BOOTSTRAP_EMAIL')?.trim() ||
      'admin@mdc.com'
    );
  }

  async getStats() {
    const usersCount = await this.adminRepository.getUsersCount(
      this.adminEmail,
    );
    const activeSubscriptions =
      await this.adminRepository.getActiveSubscriptionsCount();

    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    let revenueData = { total: 0 };
    if (this.paymentProvider.getRevenue) {
      revenueData = await this.paymentProvider.getRevenue(startDate, endDate);
    }

    return {
      totalUsers: usersCount,
      activeSubscriptions: activeSubscriptions,
      revenue30d: revenueData?.total || 0,
    };
  }

  async getRecentUsers(page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;

    const usersData = await this.adminRepository.getRecentUsers(
      this.adminEmail,
      limit,
      offset,
    );
    const totalCount = usersData.total;
    const totalPages = Math.ceil(totalCount / limit);

    const now = new Date();

    const mappedData = usersData.data.map((user: RecentAdminUser) => {
      let daysLeft = null;
      if (user.plan === 'premium' && user.validUntil) {
        const validUntilDate = new Date(user.validUntil);
        const diffTime = validUntilDate.getTime() - now.getTime();
        daysLeft =
          diffTime > 0 ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 0;
      }
      return {
        ...user,
        daysLeft,
      };
    });

    return {
      data: mappedData,
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages,
      },
    };
  }

  async updateUserPlan(
    userId: string,
    plan: 'starter' | 'premium' | 'lifetime',
  ) {
    const result = await this.subscriptionsService.overridePlan(userId, plan);
    // Invalidating user cache so frontend updates gracefully
    await this.cache.del(`profile:${userId}`);
    return result;
  }

  async getPlans() {
    return this.paymentsRepository.getAllPlans();
  }

  async updatePlan(planId: PaymentPlanId, data: PricingPlanUpdate) {
    const updatedPlan = await this.paymentsRepository.updatePlan(planId, data);

    // Invalidate the cache used by PaymentsService
    await this.cache.del('pricing:all_plans');

    return updatedPlan;
  }

  async createUser(data: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.usersService.create({
      ...data,
      password: hashedPassword,
    });
    // Create a starter subscription by default
    await this.subscriptionsService.updateOrCreate(user.id, 'starter');
    return user;
  }

  async deleteUser(id: string) {
    return this.adminRepository.deleteUser(id);
  }
}
