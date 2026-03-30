/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Drizzle is consumed through a dialect-agnostic runtime boundary in this repository. */
import { Injectable, Inject, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { DRIZZLE } from '../../database/database.provider';
import type { DrizzleClient } from '../../database/database.provider';
import {
  IPaymentsRepository,
  PricingPlan,
} from '../interfaces/payments-repository.interface';
import type { PaymentPlanId, PricingPlanUpdate } from '../pricing-plan-catalog';
import {
  getStoredPlanByPublicId,
  listPublicPricingPlans,
  type StoredPricingPlan,
} from '../pricing-plan-catalog';

@Injectable()
export class DrizzlePaymentsRepository implements IPaymentsRepository {
  private readonly logger = new Logger(DrizzlePaymentsRepository.name);

  constructor(
    @Inject(DRIZZLE)
    private readonly drizzle: DrizzleClient,
  ) {}

  private get db() {
    return this.drizzle.db;
  }

  private get schema() {
    return this.drizzle.schema;
  }

  async getPlanById(id: PaymentPlanId): Promise<PricingPlan | undefined> {
    const plans = await this.db.select().from(this.schema.pricingPlans);
    const storedPlan = getStoredPlanByPublicId(plans, id);

    if (!storedPlan) {
      return undefined;
    }

    return {
      ...storedPlan,
      id,
    };
  }

  getAllPlans(): Promise<PricingPlan[]> {
    return this.db
      .select()
      .from(this.schema.pricingPlans)
      .then((plans: StoredPricingPlan[]) => listPublicPricingPlans(plans));
  }

  async updatePlan(
    id: PaymentPlanId,
    data: PricingPlanUpdate,
  ): Promise<PricingPlan> {
    const plans = await this.db.select().from(this.schema.pricingPlans);
    const storedPlan = getStoredPlanByPublicId(plans, id);

    if (!storedPlan) {
      this.logger.warn(`Plano ${id} nao encontrado para atualizacao.`);
      throw new Error('Plano nao encontrado');
    }

    const [updatedPlan] = await this.db
      .update(this.schema.pricingPlans)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(this.schema.pricingPlans.id, storedPlan.id))
      .returning();

    return {
      ...updatedPlan,
      id,
    };
  }
}
