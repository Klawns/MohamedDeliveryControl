import { Injectable, Inject } from '@nestjs/common';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
import { count, eq, desc, ne } from 'drizzle-orm';
import * as schema from '@mdc/database';

import { DRIZZLE } from '../../database/database.provider';
import { IAdminRepository } from '../interfaces/admin-repository.interface';

@Injectable()
export class DrizzleAdminRepository implements IAdminRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: LibSQLDatabase<typeof schema>,
  ) {}

  async getUsersCount(adminEmail: string): Promise<number> {
    const [usersCount] = await this.db
      .select({ value: count() })
      .from(schema.users)
      .where(ne(schema.users.email, adminEmail));
    return usersCount.value;
  }

  async getActiveSubscriptionsCount(): Promise<number> {
    const [activeSubscriptions] = await this.db
      .select({ value: count() })
      .from(schema.subscriptions)
      .innerJoin(schema.users, eq(schema.users.id, schema.subscriptions.userId))
      .where(eq(schema.subscriptions.status, 'active'));
    return activeSubscriptions.value;
  }

  async getRecentUsers(adminEmail: string, limit: number, offset: number) {
    const [totalCount] = await this.db
      .select({ value: count() })
      .from(schema.users)
      .where(ne(schema.users.email, adminEmail));

    const usersData = await this.db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        role: schema.users.role,
        createdAt: schema.users.createdAt,
        plan: schema.subscriptions.plan,
        validUntil: schema.subscriptions.validUntil,
      })
      .from(schema.users)
      .leftJoin(
        schema.subscriptions,
        eq(schema.users.id, schema.subscriptions.userId),
      )
      .where(ne(schema.users.email, adminEmail))
      .orderBy(desc(schema.users.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data: usersData,
      total: totalCount.value,
    };
  }

  async deleteUser(id: string): Promise<void> {
    await this.db.delete(schema.users).where(eq(schema.users.id, id));
  }
}
