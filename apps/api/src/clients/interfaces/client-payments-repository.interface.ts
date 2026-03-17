import { clientPayments } from '@mdc/database';

export type ClientPayment = typeof clientPayments.$inferSelect;
export type CreateClientPaymentDto = typeof clientPayments.$inferInsert;

export const IClientPaymentsRepository = Symbol('IClientPaymentsRepository');

export interface IClientPaymentsRepository {
  findByClient(
    clientId: string,
    userId: string,
    status?: 'UNUSED' | 'USED',
  ): Promise<ClientPayment[]>;

  create(data: CreateClientPaymentDto): Promise<ClientPayment>;

  markAsUsed(clientId: string, userId: string): Promise<void>;
}
