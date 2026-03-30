/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument -- Drizzle is consumed through a dialect-agnostic runtime boundary in this repository. */
import { Injectable, Inject } from '@nestjs/common';
import { eq, and, gte, lte, sql, desc, or, like } from 'drizzle-orm';
import { DRIZZLE } from '../../database/database.provider';
import type { DrizzleClient } from '../../database/database.provider';
import type {
  FindAllFilters,
  Ride,
  RideWithClient,
} from '../interfaces/rides-repository.interface';
import { RideCursorService } from './ride-cursor.service';

@Injectable()
export class RideReadRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly drizzle: DrizzleClient,
    private readonly rideCursorService: RideCursorService,
  ) {}

  private get db() {
    return this.drizzle.db;
  }

  private get schema() {
    return this.drizzle.schema;
  }

  private buildFindAllConditions(userId: string, filters?: FindAllFilters) {
    const conditions = [eq(this.schema.rides.userId, userId)];

    if (filters?.status) {
      conditions.push(eq(this.schema.rides.status, filters.status));
    }

    if (filters?.paymentStatus) {
      conditions.push(eq(this.schema.rides.paymentStatus, filters.paymentStatus));
    }

    if (filters?.clientId && filters.clientId !== 'all') {
      conditions.push(eq(this.schema.rides.clientId, filters.clientId));
    }

    if (filters?.startDate) {
      conditions.push(gte(this.schema.rides.rideDate, filters.startDate));
    }

    if (filters?.endDate) {
      conditions.push(lte(this.schema.rides.rideDate, filters.endDate));
    }

    if (filters?.search) {
      const searchCondition = or(
        like(this.schema.clients.name, `%${filters.search}%`),
        like(this.schema.rides.notes, `%${filters.search}%`),
        like(this.schema.rides.location, `%${filters.search}%`),
      );

      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    return conditions;
  }

  private buildRideSelect() {
    return {
      id: this.schema.rides.id,
      value: this.schema.rides.value,
      notes: this.schema.rides.notes,
      status: this.schema.rides.status,
      paymentStatus: this.schema.rides.paymentStatus,
      paidWithBalance: this.schema.rides.paidWithBalance,
      debtValue: this.schema.rides.debtValue,
      rideDate: this.schema.rides.rideDate,
      createdAt: this.schema.rides.createdAt,
      location: this.schema.rides.location,
      photo: this.schema.rides.photo,
      client: {
        id: this.schema.clients.id,
        name: this.schema.clients.name,
      },
    };
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
    hasMore: boolean;
  }> {
    const conditions = this.buildFindAllConditions(userId, filters);

    if (cursor) {
      const cursorCondition = this.rideCursorService.buildCondition(
        this.schema.rides,
        this.rideCursorService.decode(cursor),
      );

      if (cursorCondition) {
        conditions.push(cursorCondition);
      }
    }

    const [results, countResult] = await Promise.all([
      this.db
        .select(this.buildRideSelect())
        .from(this.schema.rides)
        .leftJoin(
          this.schema.clients,
          eq(this.schema.rides.clientId, this.schema.clients.id),
        )
        .where(and(...conditions))
        .orderBy(
          desc(this.schema.rides.rideDate),
          desc(this.schema.rides.createdAt),
          desc(this.schema.rides.id),
        )
        .limit(limit + 1),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(this.schema.rides)
        .leftJoin(
          this.schema.clients,
          eq(this.schema.rides.clientId, this.schema.clients.id),
        )
        .where(and(...conditions)),
    ]);

    const hasMore = results.length > limit;
    const items = hasMore ? results.slice(0, limit) : results;

    return {
      rides: items as RideWithClient[],
      total: Number(countResult[0]?.count || 0),
      nextCursor: hasMore
        ? this.rideCursorService.encode({
            id: items[items.length - 1].id,
            rideDate: items[items.length - 1].rideDate,
            createdAt: items[items.length - 1].createdAt,
          })
        : undefined,
      hasMore,
    };
  }

  async findByClient(
    userId: string,
    clientId: string,
    limit: number = 20,
    cursor?: string,
  ): Promise<{
    rides: Ride[];
    total: number;
    nextCursor?: string;
    hasMore: boolean;
  }> {
    const conditions = [
      eq(this.schema.rides.userId, userId),
      eq(this.schema.rides.clientId, clientId),
    ];

    if (cursor) {
      const cursorCondition = this.rideCursorService.buildCondition(
        this.schema.rides,
        this.rideCursorService.decode(cursor),
      );

      if (cursorCondition) {
        conditions.push(cursorCondition);
      }
    }

    const [results, countResult] = await Promise.all([
      this.db
        .select()
        .from(this.schema.rides)
        .where(and(...conditions))
        .orderBy(
          desc(this.schema.rides.rideDate),
          desc(this.schema.rides.createdAt),
          desc(this.schema.rides.id),
        )
        .limit(limit + 1),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(this.schema.rides)
        .where(and(...conditions)),
    ]);

    const hasMore = results.length > limit;
    const items = hasMore ? results.slice(0, limit) : results;

    return {
      rides: items as Ride[],
      total: Number(countResult[0]?.count || 0),
      nextCursor: hasMore
        ? this.rideCursorService.encode({
            id: items[items.length - 1].id,
            rideDate: items[items.length - 1].rideDate,
            createdAt: items[items.length - 1].createdAt,
          })
        : undefined,
      hasMore,
    };
  }

  async getFrequentClients(userId: string) {
    return this.db
      .select({
        id: this.schema.clients.id,
        name: this.schema.clients.name,
        isPinned: this.schema.clients.isPinned,
      })
      .from(this.schema.clients)
      .where(
        and(
          eq(this.schema.clients.userId, userId),
          eq(this.schema.clients.isPinned, true),
        ),
      )
      .orderBy(desc(this.schema.clients.createdAt))
      .limit(10);
  }

  async countAll(userId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(this.schema.rides)
      .where(eq(this.schema.rides.userId, userId));

    return result[0].count;
  }
}
