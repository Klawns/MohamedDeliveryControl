import { systemConfigs } from '@mdc/database';
import type {
  PaymentPlanId,
  PricingPlan,
  PricingPlanUpdate,
} from '../../payments/pricing-plan-catalog';
export type {
  PaymentPlanId,
  PricingPlan,
  PricingPlanUpdate,
} from '../../payments/pricing-plan-catalog';

export type SystemConfig = typeof systemConfigs.$inferSelect;

export const IAdminSettingsRepository = Symbol('IAdminSettingsRepository');

export interface IAdminSettingsRepository {
  getPlans(): Promise<PricingPlan[]>;
  updatePlan(id: PaymentPlanId, data: PricingPlanUpdate): Promise<void>;

  getConfigs(): Promise<Record<string, string>>;
  updateConfig(key: string, value: string, description?: string): Promise<void>;

  seedInitialData(): Promise<void>;
}
