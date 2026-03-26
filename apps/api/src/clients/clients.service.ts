import { Injectable, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  IClientsRepository,
  CreateClientDto,
} from './interfaces/clients-repository.interface';
import { IClientPaymentsRepository } from './interfaces/client-payments-repository.interface';
import { IRidesRepository } from '../rides/interfaces/rides-repository.interface';
import { IBalanceTransactionsRepository } from './interfaces/balance-transactions-repository.interface';

@Injectable()
export class ClientsService {
  constructor(
    @Inject(IClientsRepository)
    private readonly clientsRepository: IClientsRepository,
    @Inject(IClientPaymentsRepository)
    private readonly clientPaymentsRepository: IClientPaymentsRepository,
    @Inject(IRidesRepository)
    private readonly ridesRepository: IRidesRepository,
    @Inject(IBalanceTransactionsRepository)
    private readonly balanceTransactionsRepository: IBalanceTransactionsRepository,
  ) {}

  async findAll(
    userId: string,
    limit?: number,
    cursor?: string,
    search?: string,
  ) {
    return this.clientsRepository.findAll(userId, limit, cursor, search);
  }

  async create(userId: string, data: { name: string }) {
    return this.clientsRepository.create({
      userId,
      name: data.name,
    } as CreateClientDto);
  }

  async findOne(userId: string, id: string) {
    return this.clientsRepository.findOne(userId, id);
  }

  async update(userId: string, id: string, data: Partial<CreateClientDto>) {
    return this.clientsRepository.update(userId, id, data);
  }

  async delete(userId: string, id: string) {
    return this.clientsRepository.delete(userId, id);
  }

  async deleteAll(userId: string) {
    return this.clientsRepository.deleteAll(userId);
  }

  async getClientBalance(userId: string, clientId: string) {
    // 1. Get total pending debt and count from DB
    const { totalDebt, pendingRidesCount } = await this.ridesRepository.getPendingDebtStats(clientId, userId);

    // 2. Get total unused payments and count from DB
    const { totalPaid, unusedPaymentsCount } = await this.clientPaymentsRepository.getUnusedPaymentsStats(clientId, userId);

    // 3. Get persisted balance from client
    const client = await this.clientsRepository.findOne(userId, clientId);
    const persistedBalance = client?.balance || 0;

    // 4. Calculate remaining balance (debt to be paid)
    // If totalPaid > totalDebt, remainingBalance is 0
    const remainingBalance = Math.max(0, totalDebt - totalPaid);

    return {
      totalDebt,
      totalPaid,
      remainingBalance,
      // Crédito disponível real (Saldo persistido + sobra de pagamentos não usados)
      clientBalance: Number(persistedBalance) + Math.max(0, Number(totalPaid) - Number(totalDebt)),
      pendingRides: pendingRidesCount,
      unusedPayments: unusedPaymentsCount,
    };
  }

  async addPartialPayment(
    userId: string,
    clientId: string,
    amount: number,
    notes?: string,
  ) {
    const result = await this.clientPaymentsRepository.create({
      id: randomUUID(),
      clientId,
      userId,
      amount,
      notes: notes || 'Pagamento parcial',
    });

    // 2. Tentar conciliação automática se o total pago agora cobrir a dívida
    const { totalDebt } = await this.ridesRepository.getPendingDebtStats(clientId, userId);
    const { totalPaid } = await this.clientPaymentsRepository.getUnusedPaymentsStats(clientId, userId);

    if (Number(totalPaid) >= Number(totalDebt)) {
      // Reconciliar automaticamente as dívidas com os pagamentos
      // Isso consolida o saldo mesmo se a dívida for zero (pré-pagamento)
      await this.closeDebt(userId, clientId);
    }

    return result;
  }

  async closeDebt(userId: string, clientId: string) {
    // 1. Get stats before closing to calculate potential overflow
    const { totalDebt } = await this.ridesRepository.getPendingDebtStats(clientId, userId);
    const { totalPaid } = await this.clientPaymentsRepository.getUnusedPaymentsStats(clientId, userId);

    // 2. Mark all pending as PAID in DB directly
    const settledCount = await this.ridesRepository.markAllAsPaidForClient(clientId, userId);

    // 3. Mark all unused partial payments as USED
    await this.clientPaymentsRepository.markAsUsed(clientId, userId);

    // 4. Handle overflow (Credit generation)
    const overflow = totalPaid - totalDebt;
    if (overflow > 0) {
      const client = await this.clientsRepository.findOne(userId, clientId);
      if (client) {
        // Update client balance
        await this.clientsRepository.update(userId, clientId, {
          balance: Number(client.balance || 0) + overflow,
        });

        // Record transaction
        await this.balanceTransactionsRepository.create({
          id: randomUUID(),
          clientId,
          userId,
          amount: overflow,
          type: 'CREDIT',
          origin: 'PAYMENT_OVERFLOW',
          description: `Crédito gerado por pagamento excedente ao quitar dívida.`,
        });
      }
    }

    return { success: true, settledRides: settledCount, generatedBalance: overflow > 0 ? overflow : 0 };
  }

  async getClientPayments(
    userId: string,
    clientId: string,
    status?: 'UNUSED' | 'USED',
  ) {
    return this.clientPaymentsRepository.findByClient(clientId, userId, status);
  }

  async getBalanceTransactions(userId: string, clientId: string) {
    return this.balanceTransactionsRepository.findByClient(clientId, userId);
  }
}
