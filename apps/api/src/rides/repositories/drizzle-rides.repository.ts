/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Drizzle is consumed through a dialect-agnostic runtime boundary in this repository. */
import { Injectable, Inject } from '@nestjs/common';
import { eq, and, ne, inArray } from 'drizzle-orm';
import { DRIZZLE } from '../../database/database.provider';
import type { DrizzleClient } from '../../database/database.provider';
import {
  IRidesRepository,
  FindAllFilters,
  Ride,
  RideWithClient,
  CreateRideDto,
  UpdateRideDto,
} from '../interfaces/rides-repository.interface';
import { RideReadRepository } from './ride-read.repository';
import { RideStatsRepository } from './ride-stats.repository';

@Injectable()
export class DrizzleRidesRepository implements IRidesRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly drizzle: DrizzleClient,
    private readonly rideReadRepository: RideReadRepository,
    private readonly rideStatsRepository: RideStatsRepository,
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

  async findAll(
    userId: string,
    limit: number = 20,
    cursor?: string,
    filters?: FindAllFilters,
  ): Promise<{
    rides: RideWithClient[];
    total: number;
    nextCursor?: string;
    hasNextPage: boolean;
  }> {
    return this.rideReadRepository.findAll(userId, limit, cursor, filters);
  }

  async create(data: CreateRideDto, executor?: any): Promise<Ride> {
    const results = await this.getExecutor(executor)
      .insert(this.schema.rides)
      .values(data as any)
      .returning();

    return results[0];
  }

  async findOne(
    userId: string,
    id: string,
    executor?: any,
  ): Promise<Ride | undefined> {
    const results = await this.getExecutor(executor)
      .select()
      .from(this.schema.rides)
      .where(
        and(eq(this.schema.rides.id, id), eq(this.schema.rides.userId, userId)),
      )
      .limit(1);

    return results[0];
  }

  async findOneWithClient(
    userId: string,
    id: string,
    executor?: any,
  ): Promise<RideWithClient | undefined> {
    return this.rideReadRepository.findOneWithClient(userId, id, executor);
  }

  async updateStatus(
    userId: string,
    id: string,
    data: {
      status?: 'PENDING' | 'COMPLETED' | 'CANCELLED';
      paymentStatus?: 'PENDING' | 'PAID';
      debtValue?: number;
    },
    executor?: any,
  ): Promise<Ride> {
    const results = await this.getExecutor(executor)
      .update(this.schema.rides)
      .set(data as any)
      .where(
        and(eq(this.schema.rides.id, id), eq(this.schema.rides.userId, userId)),
      )
      .returning();

    return results[0];
  }

  getFrequentClients(userId: string) {
    return this.rideReadRepository.getFrequentClients(userId);
  }

  async update(
    userId: string,
    id: string,
    data: UpdateRideDto,
    executor?: any,
  ): Promise<Ride> {
    const results = await this.getExecutor(executor)
      .update(this.schema.rides)
      .set(data as any)
      .where(
        and(eq(this.schema.rides.id, id), eq(this.schema.rides.userId, userId)),
      )
      .returning();

    return results[0];
  }

  async countAll(userId: string): Promise<number> {
    return this.rideReadRepository.countAll(userId);
  }

  async delete(
    userId: string,
    id: string,
    executor?: any,
  ): Promise<Ride | undefined> {
    const result = await this.getExecutor(executor)
      .delete(this.schema.rides)
      .where(
        and(eq(this.schema.rides.id, id), eq(this.schema.rides.userId, userId)),
      )
      .returning();

    return result[0];
  }

  async findManyByIds(
    userId: string,
    ids: string[],
    executor?: any,
  ): Promise<Ride[]> {
    if (ids.length === 0) {
      return [];
    }

    return this.getExecutor(executor)
      .select()
      .from(this.schema.rides)
      .where(
        and(
          eq(this.schema.rides.userId, userId),
          inArray(this.schema.rides.id, ids),
        ),
      );
  }

  async deleteManyByIds(
    userId: string,
    ids: string[],
    executor?: any,
  ): Promise<Ride[]> {
    if (ids.length === 0) {
      return [];
    }

    return this.getExecutor(executor)
      .delete(this.schema.rides)
      .where(
        and(
          eq(this.schema.rides.userId, userId),
          inArray(this.schema.rides.id, ids),
        ),
      )
      .returning();
  }

  async findByClient(
    userId: string,
    clientId: string,
    limit: number = 20,
    cursor?: string,
    filters?: Omit<FindAllFilters, 'clientId'>,
  ): Promise<{
    rides: RideWithClient[];
    total: number;
    nextCursor?: string;
    hasNextPage: boolean;
  }> {
    return this.rideReadRepository.findByClient(
      userId,
      clientId,
      limit,
      cursor,
      filters,
    );
  }

  async getStats(
    userId: string,
    start: Date,
    end: Date,
    clientId?: string,
  ): Promise<{ count: number; totalValue: number; rides: RideWithClient[] }> {
    return this.rideStatsRepository.getStats(userId, start, end, clientId);
  }

  async getPendingDebtStats(
    clientId: string,
    userId: string,
    executor?: any,
  ): Promise<{ totalDebt: number; pendingRidesCount: number }> {
    return this.rideStatsRepository.getPendingDebtStats(
      clientId,
      userId,
      executor,
    );
  }

  async markAllAsPaidForClient(
    clientId: string,
    userId: string,
    executor?: any,
  ): Promise<number> {
    const result = await this.getExecutor(executor)
      .update(this.schema.rides)
      .set({ paymentStatus: 'PAID', debtValue: 0 })
      .where(
        and(
          eq(this.schema.rides.clientId, clientId),
          eq(this.schema.rides.userId, userId),
          eq(this.schema.rides.paymentStatus, 'PENDING'),
          ne(this.schema.rides.status, 'CANCELLED'),
        ),
      )
      .returning({ updatedId: this.schema.rides.id });

    return result.length;
  }

  async deleteAll(userId: string, executor?: any): Promise<void> {
    await this.getExecutor(executor)
      .delete(this.schema.rides)
      .where(eq(this.schema.rides.userId, userId));
  }
}
