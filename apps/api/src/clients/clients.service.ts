import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
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
import { CACHE_PROVIDER } from '../cache/interfaces/cache-provider.interface';
import type { ICacheProvider } from '../cache/interfaces/cache-provider.interface';
import { UserDashboardCacheService } from '../cache/user-dashboard-cache.service';

type TransactionRunner = {
  transaction<T>(callback: (tx: unknown) => Promise<T>): Promise<T>;
};

const CLIENT_DIRECTORY_CACHE_TTL_SECONDS = 300;
const DEFAULT_CLIENT_DIRECTORY_LIMIT = 20;

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'erro desconhecido';
}

@Injectable()
export class ClientsService {
  private readonly logger = new Logger(ClientsService.name);

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
    @Inject(CACHE_PROVIDER) private readonly cache: ICacheProvider,
    private readonly userDashboardCacheService: UserDashboardCacheService,
  ) {}

  private normalizeDirectorySearch(search?: string) {
    const normalizedSearch = search?.trim().toLowerCase();
    return normalizedSearch ? encodeURIComponent(normalizedSearch) : 'all';
  }

  private getDirectoryCachePrefix(userId: string) {
    return `client-directory:${userId}:`;
  }

  private resolveDirectoryLimit(limit?: number) {
    return limit ?? DEFAULT_CLIENT_DIRECTORY_LIMIT;
  }

  private getDirectoryCacheKey(userId: string, search?: string, limit?: number) {
    return `${this.getDirectoryCachePrefix(userId)}${this.normalizeDirectorySearch(search)}:${this.resolveDirectoryLimit(limit)}`;
  }

  private async invalidateDirectoryCache(userId: string) {
    await this.cache.invalidatePrefix(this.getDirectoryCachePrefix(userId));
  }

  private async invalidateCachesAfterWrite(
    userId: string,
    context: string,
    invalidations: Array<{
      cacheName: string;
      execute: () => Promise<void>;
    }>,
  ) {
    const results = await Promise.allSettled(
      invalidations.map(({ execute }) => execute()),
    );

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        return;
      }

      const { cacheName } = invalidations[index];
      const error = result.reason;

      this.logger.error(
        `[ClientsService] Falha ao invalidar cache ${cacheName} apos ${context} do usuario ${userId}: ${getErrorMessage(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    });
  }

  private async getClientOrThrow(
    userId: string,
    clientId: string,
    executor?: unknown,
    options?: { forUpdate?: boolean },
  ) {
    const client = options?.forUpdate
      ? await this.clientsRepository.findOneForUpdate(userId, clientId, executor)
      : await this.clientsRepository.findOne(userId, clientId, executor);

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

  async findDirectory(userId: string, search?: string, limit?: number) {
    const resolvedLimit = this.resolveDirectoryLimit(limit);
    const cacheKey = this.getDirectoryCacheKey(userId, search, limit);
    const cachedDirectory = await this.cache.get<
      Awaited<ReturnType<IClientsRepository['findDirectory']>>
    >(cacheKey);

    if (cachedDirectory) {
      return cachedDirectory;
    }

    const directory = await this.clientsRepository.findDirectory(
      userId,
      search,
      resolvedLimit,
    );

    await this.cache.set(cacheKey, directory, CLIENT_DIRECTORY_CACHE_TTL_SECONDS);

    return directory;
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

    await this.invalidateCachesAfterWrite(userId, 'criacao de cliente', [
      {
        cacheName: 'user dashboard',
        execute: () => this.userDashboardCacheService.invalidate(userId),
      },
      {
        cacheName: 'client directory',
        execute: () => this.invalidateDirectoryCache(userId),
      },
    ]);
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

    await this.invalidateCachesAfterWrite(userId, 'atualizacao de cliente', [
      {
        cacheName: 'user dashboard',
        execute: () => this.userDashboardCacheService.invalidate(userId),
      },
      {
        cacheName: 'client directory',
        execute: () => this.invalidateDirectoryCache(userId),
      },
    ]);
    return updatedClient;
  }

  async delete(userId: string, id: string) {
    const startedAt = Date.now();
    const timings = {
      lookupMs: 0,
      deleteMs: 0,
      invalidateMs: 0,
    };

    const lookupStartedAt = Date.now();
    await this.getClientOrThrow(userId, id);
    timings.lookupMs = Date.now() - lookupStartedAt;

    const deleteStartedAt = Date.now();
    await this.clientsRepository.delete(userId, id);
    timings.deleteMs = Date.now() - deleteStartedAt;

    const invalidateStartedAt = Date.now();
    await this.invalidateCachesAfterWrite(userId, 'remocao de cliente', [
      {
        cacheName: 'user dashboard',
        execute: () => this.userDashboardCacheService.invalidate(userId),
      },
      {
        cacheName: 'client directory',
        execute: () => this.invalidateDirectoryCache(userId),
      },
    ]);
    timings.invalidateMs = Date.now() - invalidateStartedAt;

    this.logger.debug(
      `[ClientsService] Delete timings para cliente ${id}: lookup=${timings.lookupMs}ms delete=${timings.deleteMs}ms invalidate=${timings.invalidateMs}ms total=${Date.now() - startedAt}ms`,
    );
    return { success: true };
  }

  async bulkDelete(
    userId: string,
    data: { ids: string[] },
  ): Promise<{ requestedCount: number; deletedCount: number }> {
    let deletedCount = 0;

    await (this.drizzle.db as TransactionRunner).transaction(async (tx) => {
      const clientsToDelete = await this.clientsRepository.findManyByIds(
        userId,
        data.ids,
        tx,
      );

      if (clientsToDelete.length === 0) {
        throw new NotFoundException('Nenhum cliente encontrado.');
      }

      const deletedClients = await this.clientsRepository.deleteManyByIds(
        userId,
        clientsToDelete.map((client) => client.id),
        tx,
      );

      deletedCount = deletedClients.length;
    });

    await this.invalidateCachesAfterWrite(userId, 'remocao em lote de clientes', [
      {
        cacheName: 'user dashboard',
        execute: () => this.userDashboardCacheService.invalidate(userId),
      },
      {
        cacheName: 'client directory',
        execute: () => this.invalidateDirectoryCache(userId),
      },
    ]);

    return {
      requestedCount: data.ids.length,
      deletedCount,
    };
  }

  async deleteAll(userId: string) {
    await this.clientsRepository.deleteAll(userId);
    await this.invalidateCachesAfterWrite(
      userId,
      'remocao de todos os clientes',
      [
        {
          cacheName: 'user dashboard',
          execute: () => this.userDashboardCacheService.invalidate(userId),
        },
        {
          cacheName: 'client directory',
          execute: () => this.invalidateDirectoryCache(userId),
        },
      ],
    );
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

    await this.invalidateCachesAfterWrite(
      userId,
      'registro de pagamento parcial',
      [
        {
          cacheName: 'user dashboard',
          execute: () => this.userDashboardCacheService.invalidate(userId),
        },
      ],
    );
    return result;
  }

  async closeDebt(userId: string, clientId: string) {
    const result = await (this.drizzle.db as TransactionRunner).transaction(
      async (tx) => {
        await this.getClientOrThrow(userId, clientId, tx, { forUpdate: true });
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

        // Apenas prossegue para quitar (marcar como pago e consumir pagamentos)

        const settledCount = await this.ridesRepository.markAllAsPaidForClient(
          clientId,
          userId,
          tx,
        );

        await this.clientPaymentsRepository.markAsUsed(clientId, userId, tx);

        const overflow = Number(totalPaid) - Number(totalDebt);
        if (overflow > 0) {
          const updatedClient = await this.clientsRepository.incrementBalance(
            userId,
            clientId,
            overflow,
            tx,
          );

          if (!updatedClient) {
            throw new NotFoundException('Cliente nÃ£o encontrado.');
          }

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
      },
    );

    await this.invalidateCachesAfterWrite(userId, 'quitacao de divida', [
      {
        cacheName: 'user dashboard',
        execute: () => this.userDashboardCacheService.invalidate(userId),
      },
    ]);
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
