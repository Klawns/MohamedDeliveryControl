import { Injectable, Inject } from '@nestjs/common';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
import { eq } from 'drizzle-orm';
import * as schema from '@mdc/database';

import { DRIZZLE } from '../../database/database.provider';
import {
  IPaymentsRepository,
  PricingPlan,
} from '../interfaces/payments-repository.interface';

@Injectable()
export class DrizzlePaymentsRepository implements IPaymentsRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: LibSQLDatabase<typeof schema>,
  ) {}

  async getPlanById(id: string): Promise<PricingPlan | undefined> {
    const [plan] = await this.db
      .select()
      .from(schema.pricingPlans)
      .where(eq(schema.pricingPlans.id, id));
    return plan;
  }

  async getAllPlans(): Promise<PricingPlan[]> {
    return this.db.select().from(schema.pricingPlans);
  }

  async updatePlan(
    id: string,
    data: Partial<PricingPlan>,
  ): Promise<PricingPlan> {
    const [updatedPlan] = await this.db
      .update(schema.pricingPlans)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(schema.pricingPlans.id, id))
      .returning();

    return updatedPlan;
  }
}
