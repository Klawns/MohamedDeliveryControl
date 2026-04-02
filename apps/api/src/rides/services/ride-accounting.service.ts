import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { IClientsRepository } from '../../clients/interfaces/clients-repository.interface';
import { IBalanceTransactionsRepository } from '../../clients/interfaces/balance-transactions-repository.interface';

interface ResolvePaymentSnapshotInput {
  value: number;
  paidWithBalance: number;
  paymentStatus?: 'PENDING' | 'PAID';
}

@Injectable()
export class RideAccountingService {
  constructor(
    @Inject(IClientsRepository)
    private readonly clientsRepository: IClientsRepository,
    @Inject(IBalanceTransactionsRepository)
    private readonly balanceTransactionsRepository: IBalanceTransactionsRepository,
  ) {}

  resolvePaymentSnapshot({
    value,
    paidWithBalance,
    paymentStatus,
  }: ResolvePaymentSnapshotInput) {
    const rideTotal = Number(value);
    const normalizedPaidWithBalance = Math.max(
      0,
      Math.min(Number(paidWithBalance || 0), rideTotal),
    );
    const remainingAfterBalance = Math.max(
      0,
      rideTotal - normalizedPaidWithBalance,
    );
    const requestedPaymentStatus = paymentStatus ?? 'PAID';
    const normalizedPaymentStatus: 'PENDING' | 'PAID' =
      requestedPaymentStatus === 'PENDING' && remainingAfterBalance > 0
        ? 'PENDING'
        : 'PAID';
    const debtValue =
      normalizedPaymentStatus === 'PENDING' ? remainingAfterBalance : 0;

    return {
      rideTotal,
      paidWithBalance: normalizedPaidWithBalance,
      paymentStatus: normalizedPaymentStatus,
      debtValue,
    };
  }

  async getClientOrThrow(userId: string, clientId: string, executor?: unknown) {
    const client = await this.clientsRepository.findOne(
      userId,
      clientId,
      executor,
    );

    if (!client) {
      throw new NotFoundException('Cliente não encontrado.');
    }

    return client;
  }

  async consumeClientBalance(
    userId: string,
    clientId: string,
    rideValue: number,
    executor: unknown,
  ) {
    const client = await this.getClientOrThrow(userId, clientId, executor);
    const currentBalance = Number(client.balance || 0);
    const amountToUse = Math.min(currentBalance, Number(rideValue));

    if (amountToUse <= 0) {
      return 0;
    }

    await this.clientsRepository.update(
      userId,
      clientId,
      {
        balance: currentBalance - amountToUse,
      },
      executor,
    );

    await this.balanceTransactionsRepository.create(
      {
        id: randomUUID(),
        clientId,
        userId,
        amount: amountToUse,
        type: 'DEBIT',
        origin: 'RIDE_USAGE',
        description: 'Uso de saldo para a corrida.',
      },
      executor,
    );

    return amountToUse;
  }

  async refundClientBalance(
    userId: string,
    clientId: string,
    amount: number,
    rideId: string,
    executor: unknown,
  ) {
    if (amount <= 0) {
      return;
    }

    const client = await this.getClientOrThrow(userId, clientId, executor);
    const currentBalance = Number(client.balance || 0);

    await this.clientsRepository.update(
      userId,
      clientId,
      {
        balance: currentBalance + amount,
      },
      executor,
    );

    await this.balanceTransactionsRepository.create(
      {
        id: randomUUID(),
        clientId,
        userId,
        amount,
        type: 'CREDIT',
        origin: 'MANUAL_ADJUSTMENT',
        description: `Reversão de saldo vinculada à corrida ${rideId}.`,
      },
      executor,
    );
  }
}
