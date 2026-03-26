import { balanceTransactions } from '@mdc/database';

export type BalanceTransaction = typeof balanceTransactions.$inferSelect;
export type CreateBalanceTransactionDto = typeof balanceTransactions.$inferInsert;

export const IBalanceTransactionsRepository = Symbol('IBalanceTransactionsRepository');

export interface IBalanceTransactionsRepository {
  create(data: CreateBalanceTransactionDto): Promise<BalanceTransaction>;
  findByClient(clientId: string, userId: string): Promise<BalanceTransaction[]>;
}
