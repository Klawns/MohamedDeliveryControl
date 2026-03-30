/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument -- Drizzle is consumed through a dialect-agnostic runtime boundary in this repository. */
import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE } from '../../database/database.provider';
import type { DrizzleClient } from '../../database/database.provider';
import {
  IBalanceTransactionsRepository,
  BalanceTransaction,
  CreateBalanceTransactionDto,
} from '../interfaces/balance-transactions-repository.interface';

@Injectable()
export class DrizzleBalanceTransactionsRepository implements IBalanceTransactionsRepository {
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

  private getExecutor(executor?: any) {
    return executor ?? this.db;
  }

  async create(
    data: CreateBalanceTransactionDto,
    executor?: any,
  ): Promise<BalanceTransaction> {
    const results = await this.getExecutor(executor)
      .insert(this.schema.balanceTransactions)
      .values(data as any)
      .returning();

    return results[0];
  }
}
