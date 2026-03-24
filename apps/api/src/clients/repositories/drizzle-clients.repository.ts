import { Injectable, Inject } from '@nestjs/common';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
import { eq, and, or, like, sql, desc, lt } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import * as schema from '@mdc/database';

import { DRIZZLE } from '../../database/database.provider';
import {
  IClientsRepository,
  Client,
  CreateClientDto,
} from '../interfaces/clients-repository.interface';

@Injectable()
export class DrizzleClientsRepository implements IClientsRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: LibSQLDatabase<typeof schema>,
  ) {}

  async findAll(
    userId: string,
    limit: number = 20,
    cursor?: string,
    search?: string,
  ): Promise<{ clients: Client[]; total: number; nextCursor?: string; hasMore: boolean }> {
    const conditions = [eq(schema.clients.userId, userId)];

    if (search) {
      conditions.push(like(schema.clients.name, `%${search}%`));
    }

    if (cursor) {
      try {
        const decodedString = Buffer.from(cursor, 'base64').toString('utf-8');
        const parsedCursor = JSON.parse(decodedString);

        if (!parsedCursor.createdAt || !parsedCursor.id) {
          throw new Error('Invalid cursor payload structure');
        }

        const cursorCreatedAt = new Date(parsedCursor.createdAt);
        const cursorCondition = or(
          lt(schema.clients.createdAt, cursorCreatedAt),
          and(
            eq(schema.clients.createdAt, cursorCreatedAt),
            lt(schema.clients.id, parsedCursor.id)
          )
        );

        if (cursorCondition) {
          conditions.push(cursorCondition);
        }
      } catch (err) {
        // Fallback for old simple-date cursors if they exist
        conditions.push(lt(schema.clients.createdAt, new Date(cursor)));
      }
    }

    const query = this.db
      .select()
      .from(schema.clients)
      .where(and(...conditions))
      .orderBy(desc(schema.clients.createdAt), desc(schema.clients.id))
      .limit(limit + 1);

    const countQuery = this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.clients)
      .where(and(...conditions));

    const [results, countResult] = await Promise.all([query, countQuery]);

    const hasMore = results.length > limit;
    const items = hasMore ? results.slice(0, limit) : results;
    
    let nextCursorHash: string | undefined;
    if (hasMore) {
      const lastItem = items[items.length - 1];
      const nextCursorData = {
        createdAt: lastItem.createdAt?.toISOString() ?? new Date().toISOString(),
        id: lastItem.id,
      };
      nextCursorHash = Buffer.from(JSON.stringify(nextCursorData)).toString('base64');
    }

    return {
      clients: items,
      total: Number(countResult[0]?.count || 0),
      nextCursor: nextCursorHash,
      hasMore
    };
  }

  async create(data: CreateClientDto): Promise<Client> {
    const results = await this.db
      .insert(schema.clients)
      .values({
        ...data,
        id: data.id || randomUUID(),
      } as any)
      .returning();

    return results[0];
  }

  async findOne(userId: string, id: string): Promise<Client | undefined> {
    const results = await this.db
      .select()
      .from(schema.clients)
      .where(and(eq(schema.clients.id, id), eq(schema.clients.userId, userId)))
      .limit(1);

    return results[0];
  }

  async update(
    userId: string,
    id: string,
    data: Partial<CreateClientDto>,
  ): Promise<Client> {
    const results = await this.db
      .update(schema.clients)
      .set(data)
      .where(and(eq(schema.clients.id, id), eq(schema.clients.userId, userId)))
      .returning();

    return results[0];
  }

  async delete(userId: string, id: string): Promise<void> {
    await this.db
      .delete(schema.clients)
      .where(and(eq(schema.clients.id, id), eq(schema.clients.userId, userId)));
  }
}
