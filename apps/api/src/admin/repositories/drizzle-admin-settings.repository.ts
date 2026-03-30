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
    return this.db.select().from(this.schema.pricingPlans);
  }

  async updatePlan(id: string, data: PricingPlanUpdate): Promise<void> {
    await this.db
      .update(this.schema.pricingPlans)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(this.schema.pricingPlans.id, id));
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
    // Seed Plans if empty
    const plans = await this.db.select().from(this.schema.pricingPlans);
    if (plans.length === 0) {
      await this.db.insert(this.schema.pricingPlans).values([
        {
          id: 'starter',
          name: 'Starter',
          price: 0,
          description: 'Ideal para começar e testar a plataforma.',
          features: JSON.stringify([
            'Até 50 corridas incluídas',
            'Controle de clientes básico',
            'Relatórios mensais',
            'Suporte via comunidade',
          ]),
          cta: 'Começar Grátis',
          highlight: false,
        },
        {
          id: 'premium',
          name: 'Premium',
          price: 4990,
          interval: '/mês',
          description: '30 dias de acesso total com renovação via Pix.',
          features: JSON.stringify([
            'Corridas ilimitadas',
            'Dashboard advanced',
            'Relatórios PDF customizados',
            'Suporte prioritário',
            'Integração com pagamentos',
          ]),
          cta: 'Assinar Premium',
          highlight: true,
        },
        {
          id: 'lifetime',
          name: 'Lifetime',
          price: 49700,
          description: 'Acesso vitalício para quem não quer mensalidade.',
          features: JSON.stringify([
            'Tudo do Premium',
            'Novas atualizações para sempre',
            'Acesso antecipado a recursos',
            'Badges exclusivos',
          ]),
          cta: 'Comprar Vitalício',
          highlight: false,
        },
      ]);
    }

    // Seed default configs
    const configs = await this.getConfigs();
    if (!configs['SUPPORT_WHATSAPP']) {
      await this.updateConfig(
        'SUPPORT_WHATSAPP',
        '',
        'Link ou número para suporte via WhatsApp',
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
