/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument -- Ride service aggregates runtime-shaped repository results and normalized DTO payloads. */
import {
  Injectable,
  Inject,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { IRidesRepository } from './interfaces/rides-repository.interface';
import { getDatesFromPeriod } from '../common/utils/date.util';
import { CACHE_PROVIDER } from '../cache/interfaces/cache-provider.interface';
import type { ICacheProvider } from '../cache/interfaces/cache-provider.interface';
import { RideMapper } from './mappers/ride.mapper';
import { DRIZZLE } from '../database/database.provider';
import type { DrizzleClient } from '../database/database.provider';
import { UserDashboardCacheService } from '../cache/user-dashboard-cache.service';
import { RideAccountingService } from './services/ride-accounting.service';
import { RideStatusService } from './services/ride-status.service';
import type {
  CreateRideDto,
  UpdateRideDto,
  UpdateRideStatusDto,
  GetStatsDto,
} from './dto/rides.dto';
import type { Ride } from './interfaces/rides-repository.interface';

type TransactionRunner = {
  transaction<T>(callback: (tx: unknown) => Promise<T>): Promise<T>;
};

type RideBalanceRow = {
  id: string;
  clientId: string;
  paidWithBalance: number | null;
};

interface BulkDeleteTransaction {
  select(selection: {
    id: unknown;
    clientId: unknown;
    paidWithBalance: unknown;
  }): {
    from(table: unknown): {
      where(condition: unknown): Promise<RideBalanceRow[]>;
    };
  };
}

@Injectable()
export class RidesService {
  private readonly logger = new Logger(RidesService.name);

  constructor(
    @Inject(IRidesRepository)
    private readonly ridesRepository: IRidesRepository,
    private readonly subscriptionsService: SubscriptionsService,
    @Inject(CACHE_PROVIDER) private readonly cache: ICacheProvider,
    @Inject(DRIZZLE) private readonly drizzle: DrizzleClient,
    private readonly userDashboardCacheService: UserDashboardCacheService,
    private readonly rideAccountingService: RideAccountingService,
    private readonly rideStatusService: RideStatusService,
  ) {}

  private async getRideOrThrow(
    userId: string,
    id: string,
    executor?: unknown,
  ): Promise<Ride> {
    const ride = await this.ridesRepository.findOne(userId, id, executor);

    if (!ride) {
      throw new NotFoundException('Corrida não encontrada.');
    }

    return ride;
  }

  private async invalidateRideMutations(userId: string) {
    await this.userDashboardCacheService.invalidate(userId);
    await this.cache.del(`profile:${userId}`);
  }

  async findAll(
    userId: string,
    limit: number = 20,
    cursor?: string,
    filters?: {
      status?: 'PENDING' | 'COMPLETED' | 'CANCELLED';
      paymentStatus?: 'PENDING' | 'PAID';
      clientId?: string;
      startDate?: string;
      endDate?: string;
      search?: string;
    },
  ) {
    const parsedFilters = {
      ...filters,
      startDate: filters?.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters?.endDate ? new Date(filters.endDate) : undefined,
    };

    return this.ridesRepository.findAll(userId, limit, cursor, parsedFilters);
  }

  async create(userId: string, data: CreateRideDto): Promise<Ride> {
    this.logger.log(
      `[RidesService] Criando corrida para usuário ${userId}`,
      'RidesService',
    );

    const sub = await this.subscriptionsService.findByUserId(userId);

    if (!sub) {
      this.logger.warn(
        `[RidesService] Plano não encontrado para usuário ${userId}`,
        'RidesService',
      );
      throw new ForbiddenException('Plano não encontrado.');
    }

    const result = await (this.drizzle.db as TransactionRunner).transaction(
      async (tx) => {
        const paidWithBalance = data.useBalance
          ? await this.rideAccountingService.consumeClientBalance(
              userId,
              data.clientId,
              data.value,
              tx,
            )
          : (await this.rideAccountingService.getClientOrThrow(
              userId,
              data.clientId,
              tx,
            ),
            0);

        const {
          rideTotal,
          paidWithBalance: normalizedPaidWithBalance,
          debtValue,
          paymentStatus,
        } = this.rideAccountingService.resolvePaymentSnapshot({
          value: data.value,
          paidWithBalance,
          paymentStatus: data.paymentStatus,
        });

        return this.ridesRepository.create(
          {
            id: randomUUID(),
            clientId: data.clientId,
            value: rideTotal,
            paidWithBalance: normalizedPaidWithBalance,
            debtValue,
            location: data.location,
            notes: data.notes,
            status: data.status || 'COMPLETED',
            paymentStatus,
            rideDate: data.rideDate ? new Date(data.rideDate) : new Date(),
            photo: data.photo,
            userId,
          } as any,
          tx,
        );
      },
    );

    if (result) {
      await this.invalidateRideMutations(userId);
      this.logger.log(
        `[RidesService] Corrida ${result.id} criada com sucesso`,
        'RidesService',
      );
    }

    return result;
  }

  async update(userId: string, id: string, data: UpdateRideDto): Promise<Ride> {
    this.logger.log(`[RidesService] Atualizando corrida ${id}`, 'RidesService');

    const existingRide = await this.getRideOrThrow(userId, id);
    const { nextClientId, refundAmount, updateData } =
      this.rideStatusService.prepareRideUpdate(existingRide, data);

    const result = await (this.drizzle.db as TransactionRunner).transaction(
      async (tx) => {
        if (data.clientId !== undefined) {
          await this.rideAccountingService.getClientOrThrow(
            userId,
            nextClientId,
            tx,
          );
        }

        await this.rideAccountingService.refundClientBalance(
          userId,
          existingRide.clientId,
          refundAmount,
          id,
          tx,
        );

        return this.ridesRepository.update(userId, id, updateData, tx);
      },
    );

    if (!result) {
      throw new NotFoundException('Corrida não encontrada.');
    }

    await this.invalidateRideMutations(userId);
    this.logger.log(
      `[RidesService] Corrida ${id} atualizada com sucesso`,
      'RidesService',
    );
    return result;
  }

  async delete(userId: string, id: string): Promise<Ride> {
    this.logger.log(`[RidesService] Removendo corrida ${id}`, 'RidesService');
    const existingRide = await this.getRideOrThrow(userId, id);
    const result = await (this.drizzle.db as TransactionRunner).transaction(
      async (tx) => {
        await this.rideAccountingService.refundClientBalance(
          userId,
          existingRide.clientId,
          Number(existingRide.paidWithBalance ?? 0),
          id,
          tx,
        );

        return this.ridesRepository.delete(userId, id, tx);
      },
    );

    if (!result) {
      throw new NotFoundException('Corrida não encontrada.');
    }

    await this.invalidateRideMutations(userId);
    this.logger.log(
      `[RidesService] Corrida ${id} removida com sucesso`,
      'RidesService',
    );
    return result;
  }

  async deleteAll(userId: string): Promise<{ success: true }> {
    this.logger.log(
      `[RidesService] Removendo TODAS as corridas do usuário ${userId}`,
      'RidesService',
    );

    await (
      this.drizzle.db as {
        transaction<T>(
          callback: (tx: BulkDeleteTransaction) => Promise<T>,
        ): Promise<T>;
      }
    ).transaction(async (tx) => {
      const ridesWithBalance = await tx
        .select({
          id: this.drizzle.schema.rides.id,
          clientId: this.drizzle.schema.rides.clientId,
          paidWithBalance: this.drizzle.schema.rides.paidWithBalance,
        })
        .from(this.drizzle.schema.rides)
        .where(eq(this.drizzle.schema.rides.userId, userId));

      const refundByClient = new Map<string, number>();

      for (const ride of ridesWithBalance) {
        const paidWithBalance = Number(ride.paidWithBalance ?? 0);

        if (paidWithBalance <= 0) {
          continue;
        }

        refundByClient.set(
          ride.clientId,
          (refundByClient.get(ride.clientId) ?? 0) + paidWithBalance,
        );
      }

      for (const [clientId, amount] of refundByClient.entries()) {
        await this.rideAccountingService.refundClientBalance(
          userId,
          clientId,
          amount,
          'bulk-delete',
          tx,
        );
      }

      await this.ridesRepository.deleteAll(userId, tx);
    });

    await this.invalidateRideMutations(userId);
    this.logger.log(
      `[RidesService] Todas as corridas do usuário ${userId} removidas com sucesso`,
      'RidesService',
    );
    return { success: true };
  }

  async updateStatus(userId: string, id: string, data: UpdateRideStatusDto) {
    const existingRide = await this.getRideOrThrow(userId, id);
    const updateData = this.rideStatusService.prepareStatusUpdate(
      existingRide,
      data,
    );

    const result = await this.ridesRepository.updateStatus(
      userId,
      id,
      updateData,
    );

    if (!result) {
      throw new NotFoundException('Corrida não encontrada.');
    }

    await this.invalidateRideMutations(userId);
    return result;
  }

  async getFrequentClients(userId: string) {
    const cacheKey = `frequent-clients:${userId}`;
    const cached = await this.cache.get<any>(cacheKey);

    if (cached) {
      this.logger.debug(
        `[RidesService] CACHE HIT: ${cacheKey}`,
        'RidesService',
      );
      return cached;
    }

    this.logger.debug(
      `[RidesService] CACHE MISS: ${cacheKey}. Buscando no DB...`,
      'RidesService',
    );
    const result = await this.ridesRepository.getFrequentClients(userId);

    await this.cache.set(cacheKey, result, 1800);
    return result;
  }

  async countAll(userId: string) {
    return this.ridesRepository.countAll(userId);
  }

  async findByClient(
    userId: string,
    clientId: string,
    limit: number = 20,
    cursor?: string,
    filters?: {
      status?: 'PENDING' | 'COMPLETED' | 'CANCELLED';
      paymentStatus?: 'PENDING' | 'PAID';
      startDate?: string;
      endDate?: string;
      search?: string;
    },
  ) {
    const parsedFilters = {
      ...filters,
      startDate: filters?.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters?.endDate ? new Date(filters.endDate) : undefined,
    };

    return this.ridesRepository.findByClient(
      userId,
      clientId,
      limit,
      cursor,
      parsedFilters,
    );
  }

  async getStats(userId: string, query: GetStatsDto) {
    const isCacheable =
      process.env.NODE_ENV === 'production' &&
      query.period !== 'custom' &&
      !query.clientId;
    const cacheKey = `stats:${userId}:${query.period}`;

    if (isCacheable) {
      const cached = await this.cache.get<any>(cacheKey);
      if (cached) {
        this.logger.debug(
          `[RidesService] CACHE HIT: ${cacheKey}`,
          'RidesService',
        );
        return cached;
      }

      this.logger.debug(
        `[RidesService] CACHE MISS: ${cacheKey}. Buscando no DB e mapeando...`,
        'RidesService',
      );
    }

    const { startDate, endDate } = getDatesFromPeriod(
      query.period,
      query.start,
      query.end,
    );
    const dbResult = await this.ridesRepository.getStats(
      userId,
      startDate,
      endDate,
      query.clientId,
    );

    const mappedResult = {
      count: dbResult.count,
      totalValue: dbResult.totalValue,
      rides: RideMapper.toHttpList(dbResult.rides),
    };

    if (isCacheable) {
      await this.cache.set(cacheKey, mappedResult, 300);
    }

    return mappedResult;
  }
}
