import { Injectable, Inject } from '@nestjs/common';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
import { eq, and, like, sql, desc } from 'drizzle-orm';
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
    limit?: number,
    offset?: number,
    search?: string,
  ): Promise<{ clients: Client[]; total: number }> {
    const conditions = [eq(schema.clients.userId, userId)];

    if (search) {
      conditions.push(like(schema.clients.name, `%${search}%`));
    }

    const query = this.db
      .select()
      .from(schema.clients)
      .where(and(...conditions))
      .orderBy(desc(schema.clients.createdAt));

    if (limit !== undefined) query.limit(limit);
    if (offset !== undefined) query.offset(offset);

    // Count for all/filtered clients
    const countQuery = this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.clients)
      .where(and(...conditions));

    const [results, countResult] = await Promise.all([query, countQuery]);

    return {
      clients: results,
      total: Number(countResult[0]?.count || 0),
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
