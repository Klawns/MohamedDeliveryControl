import { Injectable, Inject, Logger } from '@nestjs/common';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
import { eq, sql, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import * as schema from '@mdc/database';

import { DRIZZLE } from '../../database/database.provider';
import {
  ISubscriptionsRepository,
  Subscription,
} from '../interfaces/subscriptions-repository.interface';

@Injectable()
export class DrizzleSubscriptionsRepository implements ISubscriptionsRepository {
  private readonly logger = new Logger(DrizzleSubscriptionsRepository.name);

  constructor(
    @Inject(DRIZZLE)
    private readonly db: LibSQLDatabase<typeof schema>,
  ) {}

  async findByUserId(userId: string): Promise<Subscription | undefined> {
    const results = await this.db
      .select()
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.userId, userId))
      .limit(1);
    return results[0];
  }

  async incrementRideCount(userId: string): Promise<Subscription[]> {
    return this.db
      .update(schema.subscriptions)
      .set({
        rideCount: sql`${schema.subscriptions.rideCount} + 1`,
        createdAt: new Date(), // using createdAt as there is no updatedAt on schema
      } as any)
      .where(eq(schema.subscriptions.userId, userId))
      .returning();
  }

  async decrementRideCount(userId: string): Promise<Subscription[]> {
    return this.db
      .update(schema.subscriptions)
      .set({
        rideCount: sql`${schema.subscriptions.rideCount} - 1`,
        createdAt: new Date(),
      } as any)
      .where(
        and(
          eq(schema.subscriptions.userId, userId),
          sql`${schema.subscriptions.rideCount} > 0`,
        ),
      )
      .returning();
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
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.userId, userId))
      .limit(1);

    let validUntil: Date | null = null;

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
          .update(schema.subscriptions)
          .set({
            plan,
            status: 'active',
            validUntil,
          } as any)
          .where(eq(schema.subscriptions.userId, userId))
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
        .insert(schema.subscriptions)
        .values({
          id: randomUUID(),
          userId,
          plan,
          status: 'active',
          validUntil,
        } as any)
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

    if (plan === 'premium') {
      const now = new Date();
      validUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    } else if (plan === 'lifetime') {
      validUntil = null;
    } else if (plan === 'starter') {
      validUntil = null;
      rideCount = 0; // Reset rides when downgraded to starter
    }

    const existing = await this.db
      .select()
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      return this.db
        .update(schema.subscriptions)
        .set({
          plan,
          status: 'active',
          validUntil,
          ...(rideCount !== undefined && { rideCount }),
        } as any)
        .where(eq(schema.subscriptions.userId, userId))
        .returning();
    } else {
      return this.db
        .insert(schema.subscriptions)
        .values({
          id: randomUUID(),
          userId,
          plan,
          status: 'active',
          validUntil,
          ...(rideCount !== undefined && { rideCount }),
        } as any)
        .returning();
    }
  }
}
