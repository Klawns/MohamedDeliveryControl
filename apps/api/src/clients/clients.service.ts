import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  IClientsRepository,
  CreateClientDto,
} from './interfaces/clients-repository.interface';
import { IClientPaymentsRepository } from './interfaces/client-payments-repository.interface';
import { IRidesRepository } from '../rides/interfaces/rides-repository.interface';
import { IBalanceTransactionsRepository } from './interfaces/balance-transactions-repository.interface';
import { DRIZZLE } from '../database/database.provider';
import type { DrizzleClient } from '../database/database.provider';
import { UserDashboardCacheService } from '../cache/user-dashboard-cache.service';

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
    @Inject(DRIZZLE) private readonly drizzle: DrizzleClient,
    private readonly userDashboardCacheService: UserDashboardCacheService,
  ) {}

  private async getClientOrThrow(
    userId: string,
    clientId: string,
    executor?: unknown,
  ) {
    const client = await this.clientsRepository.findOne(userId, clientId, executor);

    if (!client) {
      throw new NotFoundException('Cliente não encontrado.');
    }

    return client;
  }

  async findAll(
    userId: string,
    limit?: number,
    cursor?: string,
    search?: string,
  ) {
    return this.clientsRepository.findAll(userId, limit, cursor, search);
  }

  async create(
    userId: string,
    data: { name: string; phone?: string | null; address?: string | null },
  ) {
    const client = await this.clientsRepository.create({
      userId,
      name: data.name,
      phone: data.phone ?? null,
      address: data.address ?? null,
    } as CreateClientDto);

    await this.userDashboardCacheService.invalidate(userId);
    return client;
  }

  async findOne(userId: string, id: string) {
    return this.getClientOrThrow(userId, id);
  }

  async update(userId: string, id: string, data: Partial<CreateClientDto>) {
    await this.getClientOrThrow(userId, id);
    const updatedClient = await this.clientsRepository.update(userId, id, data);

    if (!updatedClient) {
      throw new NotFoundException('Cliente não encontrado.');
    }

    await this.userDashboardCacheService.invalidate(userId);
    return updatedClient;
  }

  async delete(userId: string, id: string) {
    await this.getClientOrThrow(userId, id);
    await this.clientsRepository.delete(userId, id);
    await this.userDashboardCacheService.invalidate(userId);
    return { success: true };
  }

  async deleteAll(userId: string) {
    await this.clientsRepository.deleteAll(userId);
    await this.userDashboardCacheService.invalidate(userId);
    return { success: true };
  }

  async getClientBalance(userId: string, clientId: string) {
    const { totalDebt, pendingRidesCount } =
      await this.ridesRepository.getPendingDebtStats(clientId, userId);

    const { totalPaid, unusedPaymentsCount } =
      await this.clientPaymentsRepository.getUnusedPaymentsStats(
        clientId,
        userId,
      );

    const client = await this.getClientOrThrow(userId, clientId);
    const persistedBalance = client.balance || 0;
    const remainingBalance = Math.max(0, totalDebt - totalPaid);

    return {
      totalDebt,
      totalPaid,
      remainingBalance,
      clientBalance:
        Number(persistedBalance) +
        Math.max(0, Number(totalPaid) - Number(totalDebt)),
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
    await this.getClientOrThrow(userId, clientId);

    const result = await this.clientPaymentsRepository.create({
      id: randomUUID(),
      clientId,
      userId,
      amount,
      notes: notes || 'Pagamento parcial',
    });

    const { totalDebt } = await this.ridesRepository.getPendingDebtStats(
      clientId,
      userId,
    );
    const { totalPaid } =
      await this.clientPaymentsRepository.getUnusedPaymentsStats(
        clientId,
        userId,
      );

    if (Number(totalPaid) >= Number(totalDebt)) {
      await this.closeDebt(userId, clientId);
      return result;
    }

    await this.userDashboardCacheService.invalidate(userId);
    return result;
  }

  async closeDebt(userId: string, clientId: string) {
    const result = await this.drizzle.db.transaction(async (tx: unknown) => {
      const client = await this.getClientOrThrow(userId, clientId, tx);
      const { totalDebt } = await this.ridesRepository.getPendingDebtStats(
        clientId,
        userId,
        tx,
      );
      const { totalPaid } =
        await this.clientPaymentsRepository.getUnusedPaymentsStats(
          clientId,
          userId,
          tx,
        );

      if (Number(totalPaid) < Number(totalDebt)) {
        throw new BadRequestException(
          'Pagamento insuficiente para quitar a dívida.',
        );
      }

      const settledCount = await this.ridesRepository.markAllAsPaidForClient(
        clientId,
        userId,
        tx,
      );

      await this.clientPaymentsRepository.markAsUsed(clientId, userId, tx);

      const overflow = Number(totalPaid) - Number(totalDebt);
      if (overflow > 0) {
        await this.clientsRepository.update(
          userId,
          clientId,
          {
            balance: Number(client.balance || 0) + overflow,
          },
          tx,
        );

        await this.balanceTransactionsRepository.create(
          {
            id: randomUUID(),
            clientId,
            userId,
            amount: overflow,
            type: 'CREDIT',
            origin: 'PAYMENT_OVERFLOW',
            description:
              'Crédito gerado por pagamento excedente ao quitar dívida.',
          },
          tx,
        );
      }

      return {
        success: true,
        settledRides: settledCount,
        generatedBalance: overflow > 0 ? overflow : 0,
      };
    });

    await this.userDashboardCacheService.invalidate(userId);
    return result;
  }

  async getClientPayments(
    userId: string,
    clientId: string,
    status?: 'UNUSED' | 'USED',
  ) {
    await this.getClientOrThrow(userId, clientId);
    return this.clientPaymentsRepository.findByClient(clientId, userId, status);
  }
}
