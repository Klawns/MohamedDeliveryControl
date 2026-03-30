/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Drizzle is consumed through a dialect-agnostic runtime boundary in this repository. */
import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '../../database/database.provider';
import type { DrizzleClient } from '../../database/database.provider';
import {
  IAdminSettingsRepository,
  PricingPlan,
  PricingPlanUpdate,
  SystemConfig,
} from '../interfaces/admin-settings-repository.interface';
import type { PaymentPlanId } from '../../payments/pricing-plan-catalog';
import {
  getMissingDefaultPlans,
  getStoredPlanByPublicId,
  listPublicPricingPlans,
  type StoredPricingPlan,
} from '../../payments/pricing-plan-catalog';

@Injectable()
export class DrizzleAdminSettingsRepository implements IAdminSettingsRepository {
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

  getPlans(): Promise<PricingPlan[]> {
    return this.db
      .select()
      .from(this.schema.pricingPlans)
      .then((plans: StoredPricingPlan[]) => listPublicPricingPlans(plans));
  }

  async updatePlan(id: PaymentPlanId, data: PricingPlanUpdate): Promise<void> {
    const plans = await this.db.select().from(this.schema.pricingPlans);
    const storedPlan = getStoredPlanByPublicId(plans, id);

    if (!storedPlan) {
      throw new Error('Plano nao encontrado');
    }

    await this.db
      .update(this.schema.pricingPlans)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(this.schema.pricingPlans.id, storedPlan.id));
  }

  async getConfigs(): Promise<Record<string, string>> {
    const configs = await this.db.select().from(this.schema.systemConfigs);
    return configs.reduce((acc: Record<string, string>, curr: SystemConfig) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
  }

  async updateConfig(
    key: string,
    value: string,
    description?: string,
  ): Promise<void> {
    const [existing] = await this.db
      .select()
      .from(this.schema.systemConfigs)
      .where(eq(this.schema.systemConfigs.key, key));
    if (existing) {
      await this.db
        .update(this.schema.systemConfigs)
        .set({
          value,
          description: description || existing.description,
          updatedAt: new Date(),
        })
        .where(eq(this.schema.systemConfigs.key, key));
    } else {
      await this.db.insert(this.schema.systemConfigs).values({
        key,
        value,
        description,
      });
    }
  }

  async seedInitialData(): Promise<void> {
    const plans = await this.db.select().from(this.schema.pricingPlans);
    const missingPlans = getMissingDefaultPlans(plans);

    if (missingPlans.length > 0) {
      await this.db.insert(this.schema.pricingPlans).values(missingPlans);
    }

    const configs = await this.getConfigs();
    if (!configs['SUPPORT_WHATSAPP']) {
      await this.updateConfig(
        'SUPPORT_WHATSAPP',
        '',
        'Link ou numero para suporte via WhatsApp',
      );
    }
    if (!configs['SUPPORT_EMAIL']) {
      await this.updateConfig(
        'SUPPORT_EMAIL',
        'suporte@mohameddelivery.com',
        'E-mail oficial de suporte',
      );
    }
  }
}
