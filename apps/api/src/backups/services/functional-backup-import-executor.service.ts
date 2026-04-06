/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Drizzle is consumed through a dialect-agnostic runtime boundary in this repository. */
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { UserDashboardCacheService } from '../../cache/user-dashboard-cache.service';
import { DRIZZLE } from '../../database/database.provider';
import type { DrizzleClient } from '../../database/database.provider';
import type {
  FunctionalBackupImportDataset,
  ImportedBalanceTransactionRecord,
  ImportedClientPaymentRecord,
  ImportedClientRecord,
  ImportedRidePresetRecord,
  ImportedRideRecord,
} from './functional-backup-import.types';

@Injectable()
export class FunctionalBackupImportExecutorService {
  constructor(
    @Inject(DRIZZLE)
    private readonly drizzle: DrizzleClient,
    private readonly userDashboardCacheService: UserDashboardCacheService,
  ) {}

  async execute(userId: string, dataset: FunctionalBackupImportDataset) {
    const balances = this.computeBalances(
      dataset.clients,
      dataset.balanceTransactions,
    );

    await this.drizzle.db.transaction(async (tx: any) => {
      await tx
        .delete(this.drizzle.schema.ridePresets)
        .where(eq(this.drizzle.schema.ridePresets.userId, userId));
      await tx
        .delete(this.drizzle.schema.clients)
        .where(eq(this.drizzle.schema.clients.userId, userId));

      if (dataset.clients.length > 0) {
        await tx.insert(this.drizzle.schema.clients).values(
          dataset.clients.map((client) => ({
            ...this.toClientInsertRecord(
              client,
              userId,
              balances.get(client.id) ?? 0,
            ),
          })),
        );
      }

      if (dataset.ridePresets.length > 0) {
        await tx.insert(this.drizzle.schema.ridePresets).values(
          dataset.ridePresets.map((preset) => ({
            ...this.toRidePresetInsertRecord(preset, userId),
          })),
        );
      }

      if (dataset.rides.length > 0) {
        await tx.insert(this.drizzle.schema.rides).values(
          dataset.rides.map((ride) => ({
            ...this.toRideInsertRecord(ride, userId),
          })),
        );
      }

      if (dataset.clientPayments.length > 0) {
        await tx.insert(this.drizzle.schema.clientPayments).values(
          dataset.clientPayments.map((payment) => ({
            ...this.toClientPaymentInsertRecord(payment, userId),
          })),
        );
      }

      if (dataset.balanceTransactions.length > 0) {
        await tx.insert(this.drizzle.schema.balanceTransactions).values(
          dataset.balanceTransactions.map((transaction) => ({
            ...this.toBalanceTransactionInsertRecord(transaction, userId),
          })),
        );
      }
    });

    await this.userDashboardCacheService.invalidate(userId);
  }

  private computeBalances(
    clients: ImportedClientRecord[],
    balanceTransactions: ImportedBalanceTransactionRecord[],
  ) {
    const balances = new Map<string, number>();

    for (const client of clients) {
      balances.set(client.id, 0);
    }

    for (const transaction of balanceTransactions) {
      const current = balances.get(transaction.clientId) ?? 0;
      const amount = Number(transaction.amount);
      const next =
        transaction.type === 'DEBIT' ? current - amount : current + amount;

      balances.set(transaction.clientId, next);
    }

    return balances;
  }

  private normalizeDate(value?: string | Date | null) {
    if (!value) {
      return null;
    }

    const normalized = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(normalized.getTime())) {
      throw new BadRequestException('Arquivo de backup contem data invalida.');
    }

    return normalized;
  }

  private toClientInsertRecord(
    client: ImportedClientRecord,
    userId: string,
    balance: number,
  ) {
    return {
      id: client.id,
      userId,
      name: client.name,
      phone: client.phone ?? null,
      address: client.address ?? null,
      balance,
      isPinned: Boolean(client.isPinned),
      createdAt: this.normalizeDate(client.createdAt) ?? new Date(),
    };
  }

  private toRideInsertRecord(ride: ImportedRideRecord, userId: string) {
    return {
      id: ride.id,
      clientId: ride.clientId,
      userId,
      value: ride.value,
      location: ride.location ?? null,
      notes: ride.notes ?? null,
      status: ride.status ?? 'COMPLETED',
      paymentStatus: ride.paymentStatus ?? 'PAID',
      paidWithBalance: ride.paidWithBalance ?? 0,
      debtValue: ride.debtValue ?? 0,
      rideDate: this.normalizeDate(ride.rideDate),
      photo: null,
      createdAt: this.normalizeDate(ride.createdAt) ?? new Date(),
    };
  }

  private toClientPaymentInsertRecord(
    payment: ImportedClientPaymentRecord,
    userId: string,
  ) {
    return {
      id: payment.id,
      clientId: payment.clientId,
      userId,
      amount: payment.amount,
      paymentDate: this.normalizeDate(payment.paymentDate) ?? new Date(),
      status: payment.status ?? 'UNUSED',
      notes: payment.notes ?? null,
      createdAt: this.normalizeDate(payment.createdAt) ?? new Date(),
    };
  }

  private toBalanceTransactionInsertRecord(
    transaction: ImportedBalanceTransactionRecord,
    userId: string,
  ) {
    return {
      id: transaction.id,
      clientId: transaction.clientId,
      userId,
      amount: transaction.amount,
      type: transaction.type,
      origin: transaction.origin,
      description: transaction.description ?? null,
      createdAt: this.normalizeDate(transaction.createdAt) ?? new Date(),
    };
  }

  private toRidePresetInsertRecord(
    preset: ImportedRidePresetRecord,
    userId: string,
  ) {
    return {
      id: preset.id,
      userId,
      label: preset.label,
      value: preset.value,
      location: preset.location,
      createdAt: this.normalizeDate(preset.createdAt) ?? new Date(),
    };
  }
}
