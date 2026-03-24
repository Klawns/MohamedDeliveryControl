import { Injectable, Inject, Logger, BadRequestException } from '@nestjs/common';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
import { eq, and, gte, lte, sql, desc, or, like, ne, lt } from 'drizzle-orm';
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
  private readonly logger = new Logger(DrizzleRidesRepository.name);

  constructor(
    @Inject(DRIZZLE)
    private readonly db: LibSQLDatabase<typeof schema>,
  ) {}

  async findAll(
    userId: string,
    limit: number = 20,
    cursor?: string,
    filters?: FindAllFilters,
  ): Promise<{ rides: RideWithClient[]; total: number; nextCursor?: string; hasMore: boolean }> {
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

    if (cursor) {
      try {
        const decodedString = Buffer.from(cursor, 'base64').toString('utf-8');
        const parsedCursor = JSON.parse(decodedString);

        if (!parsedCursor.rideDate || !parsedCursor.createdAt || !parsedCursor.id) {
          throw new Error('Invalid cursor payload structure');
        }

        const cursorRideDate = new Date(parsedCursor.rideDate);
        const cursorCreatedAt = new Date(parsedCursor.createdAt);

        this.logger.debug(`Cursor recebido descodificado: rideDate=${parsedCursor.rideDate}, createdAt=${parsedCursor.createdAt}, id=${parsedCursor.id}`);

        const cursorCondition = or(
          lt(schema.rides.rideDate, cursorRideDate),
          and(
            eq(schema.rides.rideDate, cursorRideDate),
            lt(schema.rides.createdAt, cursorCreatedAt)
          ),
          and(
            eq(schema.rides.rideDate, cursorRideDate),
            eq(schema.rides.createdAt, cursorCreatedAt),
            lt(schema.rides.id, parsedCursor.id)
          )
        );

        if (cursorCondition) {
          conditions.push(cursorCondition);
        }
      } catch (err: any) {
        this.logger.error(`Falha ao decodificar cursor: ${cursor}`, err.stack);
        throw new BadRequestException('Parâmetro cursor inválido ou malformado.');
      }
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
        desc(schema.rides.rideDate),
        desc(schema.rides.createdAt),
        desc(schema.rides.id),
      )
      .limit(limit + 1); // Buscamos um a mais para saber se tem próxima página

    const countQuery = this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.rides)
      .where(and(...conditions));

    const [results, countResult] = await Promise.all([query, countQuery]);

    const hasMore = results.length > limit;
    const items = hasMore ? results.slice(0, limit) : results;
    
    let nextCursorHash: string | undefined;
    if (hasMore) {
      const lastItem = items[items.length - 1]; // Baseado exclusivamente no último item real retornado
      const nextCursorData = {
        rideDate: lastItem.rideDate?.toISOString() ?? new Date().toISOString(),
        createdAt: lastItem.createdAt?.toISOString() ?? new Date().toISOString(),
        id: lastItem.id,
      };
      nextCursorHash = Buffer.from(JSON.stringify(nextCursorData)).toString('base64');
      this.logger.debug(`Gerou próximo cursor (Base64): ${nextCursorHash} originado do ID: ${lastItem.id}`);
    }

    return {
      rides: items as RideWithClient[],
      total: Number(countResult[0]?.count || 0),
      nextCursor: nextCursorHash,
      hasMore
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
    limit: number = 20,
    cursor?: string,
  ): Promise<{ rides: Ride[]; total: number; nextCursor?: string; hasMore: boolean }> {
    const conditions = [
      eq(schema.rides.userId, userId),
      eq(schema.rides.clientId, clientId),
    ];

    if (cursor) {
      try {
        const decodedString = Buffer.from(cursor, 'base64').toString('utf-8');
        const parsedCursor = JSON.parse(decodedString);

        if (!parsedCursor.rideDate || !parsedCursor.createdAt || !parsedCursor.id) {
          throw new Error('Invalid cursor payload structure');
        }

        const cursorRideDate = new Date(parsedCursor.rideDate);
        const cursorCreatedAt = new Date(parsedCursor.createdAt);

        const cursorCondition = or(
          lt(schema.rides.rideDate, cursorRideDate),
          and(
            eq(schema.rides.rideDate, cursorRideDate),
            lt(schema.rides.createdAt, cursorCreatedAt)
          ),
          and(
            eq(schema.rides.rideDate, cursorRideDate),
            eq(schema.rides.createdAt, cursorCreatedAt),
            lt(schema.rides.id, parsedCursor.id)
          )
        );

        if (cursorCondition) {
          conditions.push(cursorCondition);
        }
      } catch (err) {
        // Fallback for old simple-date cursors if they exist, or just throw
        this.logger.warn(`Failed to decode cursor for findByClient: ${cursor}. Using fallback.`);
        conditions.push(lt(schema.rides.createdAt, new Date(cursor)));
      }
    }

    const query = this.db
      .select()
      .from(schema.rides)
      .where(and(...conditions))
      .orderBy(
        desc(schema.rides.rideDate),
        desc(schema.rides.createdAt),
        desc(schema.rides.id),
      )
      .limit(limit + 1);

    const countQuery = this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.rides)
      .where(and(...conditions));

    const [results, countResult] = await Promise.all([query, countQuery]);

    const hasMore = results.length > limit;
    const items = hasMore ? results.slice(0, limit) : results;
    
    let nextCursorHash: string | undefined;
    if (hasMore) {
      const lastItem = items[items.length - 1];
      const nextCursorData = {
        rideDate: lastItem.rideDate?.toISOString() ?? new Date().toISOString(),
        createdAt: lastItem.createdAt?.toISOString() ?? new Date().toISOString(),
        id: lastItem.id,
      };
      nextCursorHash = Buffer.from(JSON.stringify(nextCursorData)).toString('base64');
    }

    return {
      rides: items as Ride[],
      total: Number(countResult[0]?.count || 0),
      nextCursor: nextCursorHash,
      hasMore
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
      gte(schema.rides.rideDate, start),
      lte(schema.rides.rideDate, end),
    ];

    if (clientId && clientId !== 'all') {
      conditions.push(eq(schema.rides.clientId, clientId));
    }

    // Busca agregados no SQL (muito mais rápido)
    const statsResult = await this.db
      .select({
        count: sql<number>`count(*)`,
        total: sql<number>`sum(${schema.rides.value})`,
      })
      .from(schema.rides)
      .where(and(...conditions));

    // Busca as corridas (limitamos a 50 para evitar sobrecarga no dashboard, 
    // já que o dashboard financeiro costuma exibir apenas o resumo ou as últimas)
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
        desc(schema.rides.rideDate),
        desc(schema.rides.createdAt),
      )
      .limit(50);

    return {
      count: Number(statsResult[0]?.count || 0),
      totalValue: Number(statsResult[0]?.total || 0),
      rides: results as RideWithClient[],
    };
  }

  async getPendingDebtStats(clientId: string, userId: string): Promise<{ totalDebt: number; pendingRidesCount: number }> {
    const result = await this.db
      .select({
        total: sql<number>`SUM(${schema.rides.value})`,
        count: sql<number>`COUNT(*)`
      })
      .from(schema.rides)
      .where(
        and(
          eq(schema.rides.clientId, clientId),
          eq(schema.rides.userId, userId),
          eq(schema.rides.paymentStatus, 'PENDING'),
          ne(schema.rides.status, 'CANCELLED')
        )
      );

    return {
      totalDebt: Number(result[0]?.total || 0),
      pendingRidesCount: Number(result[0]?.count || 0),
    };
  }

  async markAllAsPaidForClient(clientId: string, userId: string): Promise<number> {
    const result = await this.db
      .update(schema.rides)
      .set({ paymentStatus: 'PAID' })
      .where(
        and(
          eq(schema.rides.clientId, clientId),
          eq(schema.rides.userId, userId),
          eq(schema.rides.paymentStatus, 'PENDING'),
          ne(schema.rides.status, 'CANCELLED')
        )
      )
      .returning({ updatedId: schema.rides.id });
      
    return result.length;
  }
}
