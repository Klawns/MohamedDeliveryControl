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
import { ProfileCacheService } from '../cache/profile-cache.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { IRidesRepository } from './interfaces/rides-repository.interface';
import { getDatesFromPeriod } from '../common/utils/date.util';
import { RideMapper } from './mappers/ride.mapper';
import { DRIZZLE } from '../database/database.provider';
import type { DrizzleClient } from '../database/database.provider';
import { UserDashboardCacheService } from '../cache/user-dashboard-cache.service';
import { RideAccountingService } from './services/ride-accounting.service';
import { RidePhotoReferenceService } from './services/ride-photo-reference.service';
import { RideStatusService } from './services/ride-status.service';
import type {
  CreateRideDto,
  UpdateRideDto,
  UpdateRideStatusDto,
  GetStatsDto,
} from './dto/rides.dto';
import type { RideResponseDto } from './dto/ride-response.dto';
import type {
  Ride,
  RideWithClient,
} from './interfaces/rides-repository.interface';

type TransactionRunner = {
  transaction<T>(callback: (tx: unknown) => Promise<T>): Promise<T>;
};

type RideBalanceRow = {
  id: string;
  clientId: string;
  paidWithBalance: number | null;
  photo: string | null;
};

interface BulkDeleteTransaction {
  select(selection: {
    id: unknown;
    clientId: unknown;
    paidWithBalance: unknown;
    photo: unknown;
  }): {
    from(table: unknown): {
      where(condition: unknown): Promise<RideBalanceRow[]>;
    };
  };
}

interface RideStatsResult {
  count: number;
  totalValue: number;
  rides: RideResponseDto[];
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'erro desconhecido';
}

@Injectable()
export class RidesService {
  private readonly logger = new Logger(RidesService.name);

  constructor(
    @Inject(IRidesRepository)
    private readonly ridesRepository: IRidesRepository,
    private readonly subscriptionsService: SubscriptionsService,
    @Inject(DRIZZLE) private readonly drizzle: DrizzleClient,
    private readonly profileCacheService: ProfileCacheService,
    private readonly userDashboardCacheService: UserDashboardCacheService,
    private readonly rideAccountingService: RideAccountingService,
    private readonly ridePhotoReferenceService: RidePhotoReferenceService,
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

  private async getRideWithClientOrThrow(
    userId: string,
    id: string,
    executor?: unknown,
  ): Promise<RideWithClient> {
    const ride = await this.ridesRepository.findOneWithClient(
      userId,
      id,
      executor,
    );

    if (!ride) {
      throw new NotFoundException('Corrida nao encontrada.');
    }

    if (!ride) {
      throw new NotFoundException('Corrida nÃ£o encontrada.');
    }

    return ride;
  }

  private async invalidateRideMutations(userId: string) {
    const invalidations = [
      {
        cacheName: 'user dashboard',
        execute: () => this.userDashboardCacheService.invalidate(userId),
      },
      {
        cacheName: 'profile',
        execute: () => this.profileCacheService.invalidate(userId),
      },
    ];

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
        `[RidesService] Falha ao invalidar cache ${cacheName} apos mutacao da corrida para o usuario ${userId}: ${getErrorMessage(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    });
  }

  private async cleanupManagedRidePhoto(
    photo: string | null | undefined,
    context: { action: 'update' | 'delete' | 'delete-all'; userId: string },
  ) {
    if (!this.ridePhotoReferenceService.isManagedPhotoKey(photo)) {
      return;
    }

    try {
      await this.ridePhotoReferenceService.deleteManagedPhoto(photo);
    } catch (error) {
      this.logger.error(
        `[RidesService] Falha ao remover asset de foto apos ${context.action} para o usuario ${context.userId}: ${getErrorMessage(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
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

  async create(userId: string, data: CreateRideDto): Promise<RideWithClient> {
    const photo = await this.ridePhotoReferenceService.validateForCreate(
      userId,
      data.photo,
    );
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
            photo,
            userId,
          } as any,
          tx,
        );
      },
    );

    const createdRide = await this.getRideWithClientOrThrow(userId, result.id);

    await this.invalidateRideMutations(userId);
    this.logger.log(
      `[RidesService] Corrida ${result.id} criada com sucesso`,
      'RidesService',
    );

    return createdRide;
  }

  async update(
    userId: string,
    id: string,
    data: UpdateRideDto,
  ): Promise<RideWithClient> {
    this.logger.log(`[RidesService] Atualizando corrida ${id}`, 'RidesService');

    const existingRide = await this.getRideWithClientOrThrow(userId, id);
    const nextPhoto = await this.ridePhotoReferenceService.validateForUpdate(
      userId,
      data.photo,
      existingRide.photo ?? null,
    );
    const normalizedData = {
      ...data,
      photo: nextPhoto,
    };
    const { nextClientId, refundAmount, updateData } =
      this.rideStatusService.prepareRideUpdate(existingRide, normalizedData);
    const previousPhotoToCleanup =
      nextPhoto !== undefined && nextPhoto !== existingRide.photo
        ? existingRide.photo
        : null;

    const result = await (this.drizzle.db as TransactionRunner).transaction(
      async (tx) => {
        if (normalizedData.clientId !== undefined) {
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

    const updatedRide = await this.getRideWithClientOrThrow(userId, id);
    await this.cleanupManagedRidePhoto(previousPhotoToCleanup, {
      action: 'update',
      userId,
    });
    await this.invalidateRideMutations(userId);
    this.logger.log(
      `[RidesService] Corrida ${id} atualizada com sucesso`,
      'RidesService',
    );
    return updatedRide;
  }

  async delete(userId: string, id: string): Promise<void> {
    this.logger.log(`[RidesService] Removendo corrida ${id}`, 'RidesService');
    const startedAt = Date.now();
    const timings = {
      lookupMs: 0,
      transactionMs: 0,
      cleanupMs: 0,
      invalidateMs: 0,
    };

    const lookupStartedAt = Date.now();
    const existingRide = await this.getRideOrThrow(userId, id);
    timings.lookupMs = Date.now() - lookupStartedAt;

    const transactionStartedAt = Date.now();
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
    timings.transactionMs = Date.now() - transactionStartedAt;

    if (!result) {
      throw new NotFoundException('Corrida não encontrada.');
    }

    const cleanupStartedAt = Date.now();
    await this.cleanupManagedRidePhoto(existingRide.photo ?? null, {
      action: 'delete',
      userId,
    });
    timings.cleanupMs = Date.now() - cleanupStartedAt;

    const invalidateStartedAt = Date.now();
    await this.invalidateRideMutations(userId);
    timings.invalidateMs = Date.now() - invalidateStartedAt;
    this.logger.log(
      `[RidesService] Corrida ${id} removida com sucesso`,
      'RidesService',
    );
    this.logger.debug(
      `[RidesService] Delete timings para corrida ${id}: lookup=${timings.lookupMs}ms transaction=${timings.transactionMs}ms cleanup=${timings.cleanupMs}ms invalidate=${timings.invalidateMs}ms total=${Date.now() - startedAt}ms`,
    );
  }

  async deleteAll(userId: string): Promise<{ success: true }> {
    this.logger.log(
      `[RidesService] Removendo TODAS as corridas do usuário ${userId}`,
      'RidesService',
    );
    const photosToCleanup = new Set<string>();

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
          photo: this.drizzle.schema.rides.photo,
        })
        .from(this.drizzle.schema.rides)
        .where(eq(this.drizzle.schema.rides.userId, userId));

      const refundByClient = new Map<string, number>();

      for (const ride of ridesWithBalance) {
        const paidWithBalance = Number(ride.paidWithBalance ?? 0);

        if (this.ridePhotoReferenceService.isManagedPhotoKey(ride.photo)) {
          photosToCleanup.add(ride.photo);
        }

        if (paidWithBalance > 0) {
          refundByClient.set(
            ride.clientId,
            (refundByClient.get(ride.clientId) ?? 0) + paidWithBalance,
          );
        }
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

    await Promise.all(
      Array.from(photosToCleanup).map((photo) =>
        this.cleanupManagedRidePhoto(photo, {
          action: 'delete-all',
          userId,
        }),
      ),
    );
    await this.invalidateRideMutations(userId);
    this.logger.log(
      `[RidesService] Todas as corridas do usuário ${userId} removidas com sucesso`,
      'RidesService',
    );
    return { success: true };
  }

  async updateStatus(userId: string, id: string, data: UpdateRideStatusDto) {
    const existingRide = await this.getRideWithClientOrThrow(userId, id);
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

    const updatedRide = await this.getRideWithClientOrThrow(userId, id);
    await this.invalidateRideMutations(userId);
    return updatedRide;
  }

  async getFrequentClients(userId: string) {
    const cached =
      await this.userDashboardCacheService.getFrequentClients<any>(userId);

    if (cached) {
      this.logger.debug(
        `[RidesService] CACHE HIT: frequent-clients:${userId}`,
        'RidesService',
      );
      return cached;
    }

    this.logger.debug(
      `[RidesService] CACHE MISS: frequent-clients:${userId}. Buscando no DB...`,
      'RidesService',
    );
    const result = await this.ridesRepository.getFrequentClients(userId);

    await this.userDashboardCacheService.setFrequentClients(userId, result);
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

  async getStats(userId: string, query: GetStatsDto): Promise<RideStatsResult> {
    const isCacheable =
      process.env.NODE_ENV === 'production' &&
      query.period !== 'custom' &&
      !query.clientId;

    if (isCacheable) {
      const cached = await this.userDashboardCacheService.getStats<any>(
        userId,
        query.period,
      );
      if (cached) {
        this.logger.debug(
          `[RidesService] CACHE HIT: stats:${userId}:${query.period}`,
          'RidesService',
        );
        return cached;
      }

      this.logger.debug(
        `[RidesService] CACHE MISS: stats:${userId}:${query.period}. Buscando no DB e mapeando...`,
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
      await this.userDashboardCacheService.setStats(
        userId,
        query.period,
        mappedResult,
      );
    }

    return mappedResult;
  }
}
