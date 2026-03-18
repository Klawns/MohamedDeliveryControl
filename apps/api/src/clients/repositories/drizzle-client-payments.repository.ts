import { Injectable, Inject } from '@nestjs/common';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
import { eq, and, desc, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import * as schema from '@mdc/database';

import { DRIZZLE } from '../../database/database.provider';
import {
  IClientPaymentsRepository,
  ClientPayment,
  CreateClientPaymentDto,
} from '../interfaces/client-payments-repository.interface';

@Injectable()
export class DrizzleClientPaymentsRepository implements IClientPaymentsRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: LibSQLDatabase<typeof schema>,
  ) {}

  async findByClient(
    clientId: string,
    userId: string,
    status?: 'UNUSED' | 'USED',
  ): Promise<ClientPayment[]> {
    const conditions = [
      eq(schema.clientPayments.clientId, clientId),
      eq(schema.clientPayments.userId, userId),
    ];

    if (status) {
      conditions.push(eq(schema.clientPayments.status, status));
    }

    return this.db
      .select()
      .from(schema.clientPayments)
      .where(and(...conditions))
      .orderBy(desc(schema.clientPayments.createdAt));
  }

  async create(data: CreateClientPaymentDto): Promise<ClientPayment> {
    const results = await this.db
      .insert(schema.clientPayments)
      .values({
        ...data,
        id: data.id || randomUUID(),
      } as any)
      .returning();

    return results[0];
  }

  async markAsUsed(clientId: string, userId: string): Promise<void> {
    await this.db
      .update(schema.clientPayments)
      .set({ status: 'USED' })
      .where(
        and(
          eq(schema.clientPayments.clientId, clientId),
          eq(schema.clientPayments.userId, userId),
          eq(schema.clientPayments.status, 'UNUSED'),
        ),
      );
  }

  async getUnusedPaymentsStats(clientId: string, userId: string): Promise<{ totalPaid: number; unusedPaymentsCount: number }> {
    const result = await this.db
      .select({
        total: sql<number>`SUM(${schema.clientPayments.amount})`,
        count: sql<number>`COUNT(*)`
      })
      .from(schema.clientPayments)
      .where(
        and(
          eq(schema.clientPayments.clientId, clientId),
          eq(schema.clientPayments.userId, userId),
          eq(schema.clientPayments.status, 'UNUSED')
        )
      );

    return {
      totalPaid: Number(result[0]?.total || 0),
      unusedPaymentsCount: Number(result[0]?.count || 0),
    };
  }
}
