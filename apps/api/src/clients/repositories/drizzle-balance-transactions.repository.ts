import { Injectable, Inject } from '@nestjs/common';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
import { eq, and, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import * as schema from '@mdc/database';

import { DRIZZLE } from '../../database/database.provider';
import {
  IBalanceTransactionsRepository,
  BalanceTransaction,
  CreateBalanceTransactionDto,
} from '../interfaces/balance-transactions-repository.interface';

@Injectable()
export class DrizzleBalanceTransactionsRepository implements IBalanceTransactionsRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: LibSQLDatabase<typeof schema>,
  ) {}

  async create(data: CreateBalanceTransactionDto): Promise<BalanceTransaction> {
    const results = await this.db
      .insert(schema.balanceTransactions)
      .values({
        ...data,
        id: data.id || randomUUID(),
      } as any)
      .returning();

    return results[0];
  }

  async findByClient(clientId: string, userId: string): Promise<BalanceTransaction[]> {
    return this.db
      .select()
      .from(schema.balanceTransactions)
      .where(
        and(
          eq(schema.balanceTransactions.clientId, clientId),
          eq(schema.balanceTransactions.userId, userId),
        ),
      )
      .orderBy(desc(schema.balanceTransactions.createdAt));
  }
}
