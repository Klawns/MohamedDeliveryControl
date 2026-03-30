/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument -- Drizzle is consumed through a dialect-agnostic runtime boundary in this repository. */
import { Injectable, Inject, Logger } from '@nestjs/common';
import { eq, and, or, like, sql, desc, lt, gt, count } from 'drizzle-orm';
import { randomUUID } from 'crypto';

import { DRIZZLE } from '../../database/database.provider';
import type { DrizzleClient } from '../../database/database.provider';
import {
  IClientsRepository,
  Client,
  CreateClientDto,
} from '../interfaces/clients-repository.interface';

@Injectable()
export class DrizzleClientsRepository implements IClientsRepository {
  private readonly logger = new Logger(DrizzleClientsRepository.name);

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

  private getExecutor(executor?: any) {
    return executor ?? this.db;
  }

  async findAll(
    userId: string,
    limit: number = 20,
    cursor?: string,
    search?: string,
  ): Promise<{
    clients: Client[];
    total: number;
    nextCursor?: string;
    hasMore: boolean;
  }> {
    const conditions = [eq(this.schema.clients.userId, userId)];

    if (search) {
      conditions.push(like(this.schema.clients.name, `%${search}%`));
    }

    if (cursor) {
      try {
        const decodedString = Buffer.from(cursor, 'base64').toString('utf-8');
        const parsedCursor = JSON.parse(decodedString);

        if (
          parsedCursor.name === undefined ||
          parsedCursor.isPinned === undefined ||
          !parsedCursor.id
        ) {
          throw new Error('Invalid cursor payload structure');
        }

        const cursorCondition = or(
          lt(this.schema.clients.isPinned, parsedCursor.isPinned),
          and(
            eq(this.schema.clients.isPinned, parsedCursor.isPinned),
            or(
              gt(
                sql`lower(${this.schema.clients.name})`,
                sql`lower(${parsedCursor.name})`,
              ),
              and(
                eq(
                  sql`lower(${this.schema.clients.name})`,
                  sql`lower(${parsedCursor.name})`,
                ),
                gt(this.schema.clients.id, parsedCursor.id),
              ),
            ),
          ),
        );

        if (cursorCondition) {
          conditions.push(cursorCondition);
        }
      } catch {
        // Fallback or ignore invalid cursor
      }
    }

    const query = this.db
      .select()
      .from(this.schema.clients)
      .where(and(...conditions))
      .orderBy(
        desc(this.schema.clients.isPinned),
        sql`lower(${this.schema.clients.name}) asc`,
        this.schema.clients.id,
      )
      .limit(limit + 1);

    const countQuery = this.db
      .select({ value: count() })
      .from(this.schema.clients)
      .where(and(...conditions));

    const [results, countResult] = await Promise.all([query, countQuery]);

    const hasMore = results.length > limit;
    const items = hasMore ? results.slice(0, limit) : results;

    let nextCursorHash: string | undefined;
    if (hasMore) {
      const lastItem = items[items.length - 1];
      const nextCursorData = {
        isPinned: lastItem.isPinned,
        name: lastItem.name,
        id: lastItem.id,
      };
      nextCursorHash = Buffer.from(JSON.stringify(nextCursorData)).toString(
        'base64',
      );
    }

    return {
      clients: items,
      total: countResult[0]?.value || 0,
      nextCursor: nextCursorHash,
      hasMore,
    };
  }

  async create(data: CreateClientDto, executor?: any): Promise<Client> {
    const results = await this.getExecutor(executor)
      .insert(this.schema.clients)
      .values({
        ...data,
        id: data.id || randomUUID(),
      } as any)
      .returning();

    return results[0];
  }

  async findOne(
    userId: string,
    id: string,
    executor?: any,
  ): Promise<Client | undefined> {
    const results = await this.getExecutor(executor)
      .select()
      .from(this.schema.clients)
      .where(
        and(
          eq(this.schema.clients.id, id),
          eq(this.schema.clients.userId, userId),
        ),
      )
      .limit(1);

    return results[0];
  }

  async update(
    userId: string,
    id: string,
    data: Partial<CreateClientDto>,
    executor?: any,
  ): Promise<Client> {
    const results = await this.getExecutor(executor)
      .update(this.schema.clients)
      .set(data)
      .where(
        and(
          eq(this.schema.clients.id, id),
          eq(this.schema.clients.userId, userId),
        ),
      )
      .returning();

    return results[0];
  }

  async delete(userId: string, id: string, executor?: any): Promise<void> {
    await this.getExecutor(executor)
      .delete(this.schema.clients)
      .where(
        and(
          eq(this.schema.clients.id, id),
          eq(this.schema.clients.userId, userId),
        ),
      );
  }

  async deleteAll(userId: string): Promise<void> {
    await this.db
      .delete(this.schema.clients)
      .where(eq(this.schema.clients.userId, userId));
  }
}
