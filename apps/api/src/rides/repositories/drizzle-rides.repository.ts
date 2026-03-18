import { Injectable, Inject } from '@nestjs/common';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
import { eq, and, gte, lte, sql, desc, or, like } from 'drizzle-orm';
import * as schema from '@mdc/database';

import { DRIZZLE } from '../../database/database.provider';
import {
  IRidesRepository,
  FindAllFilters,
  Ride,
  RideWithClient,
  CreateRideDto,
  UpdateRideDto,
} from '../interfaces/rides-repository.interface';

@Injectable()
export class DrizzleRidesRepository implements IRidesRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: LibSQLDatabase<typeof schema>,
  ) {}

  async findAll(
    userId: string,
    limit?: number,
    offset?: number,
    filters?: FindAllFilters,
  ): Promise<{ rides: RideWithClient[]; total: number }> {
    const conditions = [eq(schema.rides.userId, userId)];

    if (filters?.status)
      conditions.push(eq(schema.rides.status, filters.status));
    if (filters?.paymentStatus)
      conditions.push(eq(schema.rides.paymentStatus, filters.paymentStatus));
    if (filters?.clientId && filters.clientId !== 'all')
      conditions.push(eq(schema.rides.clientId, filters.clientId));
    if (filters?.startDate)
      conditions.push(gte(schema.rides.rideDate, filters.startDate));
    if (filters?.endDate)
      conditions.push(lte(schema.rides.rideDate, filters.endDate));

    if (filters?.search) {
      const searchCondition = or(
        like(schema.clients.name, `%${filters.search}%`),
        like(schema.rides.notes, `%${filters.search}%`),
        like(schema.rides.location, `%${filters.search}%`),
      );
      if (searchCondition) conditions.push(searchCondition);
    }

    const query = this.db
      .select({
        id: schema.rides.id,
        value: schema.rides.value,
        notes: schema.rides.notes,
        status: schema.rides.status,
        paymentStatus: schema.rides.paymentStatus,
        rideDate: schema.rides.rideDate,
        createdAt: schema.rides.createdAt,
        location: schema.rides.location,
        photo: schema.rides.photo,
        client: {
          id: schema.clients.id,
          name: schema.clients.name,
        },
      })
      .from(schema.rides)
      .leftJoin(schema.clients, eq(schema.rides.clientId, schema.clients.id))
      .where(and(...conditions))
      .orderBy(
        desc(
          sql`COALESCE(${schema.rides.rideDate}, ${schema.rides.createdAt})`,
        ),
        desc(schema.rides.createdAt),
        desc(schema.rides.id),
      );

    if (limit !== undefined) query.limit(limit);
    if (offset !== undefined) query.offset(offset);

    const countQuery = this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.rides)
      .where(and(...conditions));

    const [results, countResult] = await Promise.all([query, countQuery]);

    return {
      rides: results as RideWithClient[],
      total: Number(countResult[0]?.count || 0),
    };
  }

  async create(data: CreateRideDto): Promise<Ride> {
    const results = await this.db
      .insert(schema.rides)
      .values(data as any)
      .returning();

    return results[0];
  }

  async updateStatus(
    userId: string,
    id: string,
    data: {
      status?: 'PENDING' | 'COMPLETED' | 'CANCELLED';
      paymentStatus?: 'PENDING' | 'PAID';
    },
  ): Promise<Ride> {
    const results = await this.db
      .update(schema.rides)
      .set(data)
      .where(and(eq(schema.rides.id, id), eq(schema.rides.userId, userId)))
      .returning();

    return results[0];
  }

  async getFrequentClients(userId: string) {
    const results = await this.db
      .select({
        id: schema.clients.id,
        name: schema.clients.name,
        isPinned: schema.clients.isPinned,
      })
      .from(schema.clients)
      .where(
        and(
          eq(schema.clients.userId, userId),
          eq(schema.clients.isPinned, true),
        ),
      )
      .orderBy(desc(schema.clients.createdAt))
      .limit(10);

    return results;
  }

  async update(userId: string, id: string, data: UpdateRideDto): Promise<Ride> {
    const results = await this.db
      .update(schema.rides)
      .set(data as any)
      .where(and(eq(schema.rides.id, id), eq(schema.rides.userId, userId)))
      .returning();

    return results[0];
  }

  async countAll(userId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.rides)
      .where(eq(schema.rides.userId, userId));

    return result[0].count;
  }

  async delete(userId: string, id: string): Promise<Ride | undefined> {
    const result = await this.db
      .delete(schema.rides)
      .where(and(eq(schema.rides.id, id), eq(schema.rides.userId, userId)))
      .returning();

    return result[0];
  }

  async findByClient(
    userId: string,
    clientId: string,
    limit?: number,
    offset?: number,
  ): Promise<{ rides: Ride[]; total: number }> {
    const query = this.db
      .select()
      .from(schema.rides)
      .where(
        and(
          eq(schema.rides.userId, userId),
          eq(schema.rides.clientId, clientId),
        ),
      )
      .orderBy(
        desc(
          sql`COALESCE(${schema.rides.rideDate}, ${schema.rides.createdAt})`,
        ),
        desc(schema.rides.createdAt),
        desc(schema.rides.id),
      );

    if (limit !== undefined) query.limit(limit);
    if (offset !== undefined) query.offset(offset);

    const countQuery = this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.rides)
      .where(
        and(
          eq(schema.rides.userId, userId),
          eq(schema.rides.clientId, clientId),
        ),
      );

    const [results, countResult] = await Promise.all([query, countQuery]);

    return {
      rides: results,
      total: Number(countResult[0]?.count || 0),
    };
  }

  async getStats(
    userId: string,
    start: Date,
    end: Date,
    clientId?: string,
  ): Promise<{ count: number; totalValue: number; rides: RideWithClient[] }> {
    const conditions = [
      eq(schema.rides.userId, userId),
      gte(schema.rides.createdAt, start),
      lte(schema.rides.createdAt, end),
    ];

    if (clientId && clientId !== 'all') {
      conditions.push(eq(schema.rides.clientId, clientId));
    }

    const results = await this.db
      .select({
        id: schema.rides.id,
        value: schema.rides.value,
        notes: schema.rides.notes,
        status: schema.rides.status,
        paymentStatus: schema.rides.paymentStatus,
        rideDate: schema.rides.rideDate,
        createdAt: schema.rides.createdAt,
        location: schema.rides.location,
        photo: schema.rides.photo,
        client: {
          id: schema.clients.id,
          name: schema.clients.name,
        },
      })
      .from(schema.rides)
      .leftJoin(schema.clients, eq(schema.rides.clientId, schema.clients.id))
      .where(and(...conditions))
      .orderBy(
        desc(
          sql`COALESCE(${schema.rides.rideDate}, ${schema.rides.createdAt})`,
        ),
        desc(schema.rides.createdAt),
        desc(schema.rides.id),
      );

    const totalValue = results.reduce(
      (acc, ride) => acc + (ride.value || 0),
      0,
    );
    const count = results.length;

    return {
      count,
      totalValue,
      rides: results as RideWithClient[],
    };
  }
}
