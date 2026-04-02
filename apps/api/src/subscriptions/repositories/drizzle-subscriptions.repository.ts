/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument -- Drizzle is consumed through a dialect-agnostic runtime boundary in this repository. */
import { Injectable, Inject, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

import { DRIZZLE } from '../../database/database.provider';
import type { DrizzleClient } from '../../database/database.provider';
import {
  ISubscriptionsRepository,
  Subscription,
} from '../interfaces/subscriptions-repository.interface';

@Injectable()
export class DrizzleSubscriptionsRepository implements ISubscriptionsRepository {
  private readonly logger = new Logger(DrizzleSubscriptionsRepository.name);

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

  async findByUserId(userId: string): Promise<Subscription | undefined> {
    const results = await this.db
      .select()
      .from(this.schema.subscriptions)
      .where(eq(this.schema.subscriptions.userId, userId))
      .limit(1);
    return results[0];
  }

  async updateOrCreate(
    userId: string,
    plan: 'starter' | 'premium' | 'lifetime',
  ): Promise<Subscription[]> {
    this.logger.debug(
      `[Subscription] Iniciando atualização de plano. User: ${userId}, Plan: ${plan}`,
    );
    const existing = await this.db
      .select()
      .from(this.schema.subscriptions)
      .where(eq(this.schema.subscriptions.userId, userId))
      .limit(1);

    let validUntil: Date | null = null;
    const trialStartedAt =
      plan === 'starter' ? (existing[0]?.trialStartedAt ?? new Date()) : null;

    if (plan === 'premium') {
      const now = new Date();
      const currentValidUntil = existing[0]?.validUntil;

      const baseDate =
        currentValidUntil && currentValidUntil > now ? currentValidUntil : now;
      validUntil = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    } else if (plan === 'lifetime') {
      validUntil = null;
    }

    if (existing.length > 0) {
      this.logger.debug(
        `[Subscription] Atualizando plano existente para o usuário ${userId}`,
      );
      try {
        const updated = await this.db
          .update(this.schema.subscriptions)
          .set({
            plan,
            status: 'active',
            trialStartedAt,
            validUntil,
          })
          .where(eq(this.schema.subscriptions.userId, userId))
          .returning();
        this.logger.debug(
          `[Subscription] Plano atualizado com sucesso: ${JSON.stringify(updated[0])}`,
        );
        return updated;
      } catch (error) {
        this.logger.error(
          `[Subscription] Erro ao atualizar plano para o usuário ${userId}:`,
          error,
        );
        throw error;
      }
    }

    this.logger.debug(
      `[Subscription] Criando novo plano para o usuário ${userId}`,
    );
    try {
      const inserted = await this.db
        .insert(this.schema.subscriptions)
        .values({
          id: randomUUID(),
          userId,
          plan,
          status: 'active',
          trialStartedAt,
          validUntil,
        })
        .returning();
      this.logger.debug(
        `[Subscription] Novo plano criado com sucesso: ${JSON.stringify(inserted[0])}`,
      );
      return inserted;
    } catch (error) {
      this.logger.error(
        `[Subscription] Erro ao criar novo plano para o usuário ${userId}:`,
        error,
      );
      throw error;
    }
  }

  async overridePlan(
    userId: string,
    plan: 'starter' | 'premium' | 'lifetime',
  ): Promise<Subscription[]> {
    this.logger.debug(
      `[Subscription] Forçando alteração de plano. User: ${userId}, Plan: ${plan}`,
    );

    let validUntil: Date | null = null;
    let rideCount = undefined;
    let trialStartedAt: Date | null | undefined = undefined;

    if (plan === 'premium') {
      const now = new Date();
      validUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    } else if (plan === 'lifetime') {
      validUntil = null;
    } else if (plan === 'starter') {
      validUntil = null;
      rideCount = 0;
      trialStartedAt = new Date();
    }

    const existing = await this.db
      .select()
      .from(this.schema.subscriptions)
      .where(eq(this.schema.subscriptions.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      return this.db
        .update(this.schema.subscriptions)
        .set({
          plan,
          status: 'active',
          validUntil,
          ...(trialStartedAt !== undefined && { trialStartedAt }),
          ...(rideCount !== undefined && { rideCount }),
        })
        .where(eq(this.schema.subscriptions.userId, userId))
        .returning();
    } else {
      return this.db
        .insert(this.schema.subscriptions)
        .values({
          id: randomUUID(),
          userId,
          plan,
          status: 'active',
          validUntil,
          ...(trialStartedAt !== undefined && { trialStartedAt }),
          ...(rideCount !== undefined && { rideCount }),
        })
        .returning();
    }
  }
}
