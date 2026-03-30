/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument -- Drizzle is consumed through a dialect-agnostic runtime boundary in this repository. */
import { Injectable, Inject } from '@nestjs/common';
import { eq, and, gte, lte, sql, desc, ne } from 'drizzle-orm';
import { DRIZZLE } from '../../database/database.provider';
import type { DrizzleClient } from '../../database/database.provider';
import type { RideWithClient } from '../interfaces/rides-repository.interface';

@Injectable()
export class RideStatsRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly drizzle: DrizzleClient,
  ) {}

  private get db() {
    return this.drizzle.db;
  }

  private get schema() {
    return this.drizzle.schema;
  }

  async getStats(
    userId: string,
    start: Date,
    end: Date,
    clientId?: string,
  ): Promise<{ count: number; totalValue: number; rides: RideWithClient[] }> {
    const conditions = [
      eq(this.schema.rides.userId, userId),
      gte(this.schema.rides.rideDate, start),
      lte(this.schema.rides.rideDate, end),
    ];

    if (clientId && clientId !== 'all') {
      conditions.push(eq(this.schema.rides.clientId, clientId));
    }

    const [statsResult, results] = await Promise.all([
      this.db
        .select({
          count: sql<number>`count(*)`,
          total: sql<number>`sum(${this.schema.rides.value})`,
        })
        .from(this.schema.rides)
        .where(and(...conditions)),
      this.db
        .select({
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
        })
        .from(this.schema.rides)
        .leftJoin(
          this.schema.clients,
          eq(this.schema.rides.clientId, this.schema.clients.id),
        )
        .where(and(...conditions))
        .orderBy(
          desc(this.schema.rides.rideDate),
          desc(this.schema.rides.createdAt),
        )
        .limit(50),
    ]);

    return {
      count: Number(statsResult[0]?.count || 0),
      totalValue: Number(statsResult[0]?.total || 0),
      rides: results as RideWithClient[],
    };
  }

  async getPendingDebtStats(
    clientId: string,
    userId: string,
    executor?: any,
  ): Promise<{ totalDebt: number; pendingRidesCount: number }> {
    const result = await (executor ?? this.db)
      .select({
        total: sql<number>`SUM(${this.schema.rides.debtValue})`,
        count: sql<number>`COUNT(*)`,
      })
      .from(this.schema.rides)
      .where(
        and(
          eq(this.schema.rides.clientId, clientId),
          eq(this.schema.rides.userId, userId),
          eq(this.schema.rides.paymentStatus, 'PENDING'),
          ne(this.schema.rides.status, 'CANCELLED'),
        ),
      );

    return {
      totalDebt: Number(result[0]?.total || 0),
      pendingRidesCount: Number(result[0]?.count || 0),
    };
  }
}
