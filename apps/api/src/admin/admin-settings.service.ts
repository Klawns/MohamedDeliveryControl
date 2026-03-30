import {
  Injectable,
  Inject,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PAYMENT_PROVIDER } from '../payments/providers/payment-provider.interface';
import type { IPaymentProvider } from '../payments/providers/payment-provider.interface';
import {
  IAdminSettingsRepository,
  type PricingPlanUpdate,
} from './interfaces/admin-settings-repository.interface';
import type { PaymentPlanId } from '../payments/pricing-plan-catalog';
import type { CreateCouponDto } from './dto/admin.dto';
import { CACHE_PROVIDER } from '../cache/interfaces/cache-provider.interface';
import type { ICacheProvider } from '../cache/interfaces/cache-provider.interface';

@Injectable()
export class AdminSettingsService {
  constructor(
    @Inject(IAdminSettingsRepository)
    private readonly adminSettingsRepository: IAdminSettingsRepository,
    @Inject(CACHE_PROVIDER)
    private readonly cache: ICacheProvider,
    @Inject(PAYMENT_PROVIDER)
    private provider: IPaymentProvider,
  ) {}

  async listCoupons(): Promise<unknown[]> {
    if (!this.provider.listCoupons) {
      throw new ServiceUnavailableException(
        'Promo codes are unavailable while the payment provider is disabled or unsupported.',
      );
    }
    return this.provider.listCoupons();
  }

  async createCoupon(data: CreateCouponDto): Promise<unknown> {
    if (!this.provider.createCoupon) {
      throw new ServiceUnavailableException(
        'Promo codes are unavailable while the payment provider is disabled or unsupported.',
      );
    }
    return this.provider.createCoupon(data);
  }

  async getPlans() {
    return this.adminSettingsRepository.getPlans();
  }

  async updatePlan(id: PaymentPlanId, data: PricingPlanUpdate): Promise<void> {
    return this.adminSettingsRepository.updatePlan(id, data);
  }

  async getConfigs() {
    return this.adminSettingsRepository.getConfigs();
  }

  async updateConfig(key: string, value: string, description?: string) {
    return this.adminSettingsRepository.updateConfig(key, value, description);
  }

  async seedInitialData() {
    await this.adminSettingsRepository.seedInitialData();
    await this.cache.del('pricing:all_plans');
  }
}
