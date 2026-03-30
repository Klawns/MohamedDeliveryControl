import type {
  PaymentPlanId,
  PricingPlan,
  PricingPlanUpdate,
} from '../pricing-plan-catalog';
export type {
  PaymentPlanId,
  PricingPlan,
  PricingPlanUpdate,
} from '../pricing-plan-catalog';

export const IPaymentsRepository = Symbol('IPaymentsRepository');

export interface IPaymentsRepository {
  getPlanById(id: PaymentPlanId): Promise<PricingPlan | undefined>;
  getAllPlans(): Promise<PricingPlan[]>;
  updatePlan(id: PaymentPlanId, data: PricingPlanUpdate): Promise<PricingPlan>;
}
