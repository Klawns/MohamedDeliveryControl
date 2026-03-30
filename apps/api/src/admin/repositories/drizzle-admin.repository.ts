/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument -- Drizzle is consumed through a dialect-agnostic runtime boundary in this repository. */
import { Injectable, Inject } from '@nestjs/common';
import { count, eq, desc, ne } from 'drizzle-orm';

import { DRIZZLE } from '../../database/database.provider';
import type { DrizzleClient } from '../../database/database.provider';
import {
  IAdminRepository,
  type RecentAdminUser,
} from '../interfaces/admin-repository.interface';

@Injectable()
export class DrizzleAdminRepository implements IAdminRepository {
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

  async getUsersCount(adminEmail: string): Promise<number> {
    const [usersCount] = await this.db
      .select({ value: count() })
      .from(this.schema.users)
      .where(ne(this.schema.users.email, adminEmail));
    return usersCount.value;
  }

  async getActiveSubscriptionsCount(): Promise<number> {
    const [activeSubscriptions] = await this.db
      .select({ value: count() })
      .from(this.schema.subscriptions)
      .innerJoin(
        this.schema.users,
        eq(this.schema.users.id, this.schema.subscriptions.userId),
      )
      .where(eq(this.schema.subscriptions.status, 'active'));
    return activeSubscriptions.value;
  }

  async getRecentUsers(
    adminEmail: string,
    limit: number,
    offset: number,
  ): Promise<{ data: RecentAdminUser[]; total: number }> {
    const [totalCount] = await this.db
      .select({ value: count() })
      .from(this.schema.users)
      .where(ne(this.schema.users.email, adminEmail));

    const usersData = await this.db
      .select({
        id: this.schema.users.id,
        name: this.schema.users.name,
        email: this.schema.users.email,
        role: this.schema.users.role,
        createdAt: this.schema.users.createdAt,
        plan: this.schema.subscriptions.plan,
        validUntil: this.schema.subscriptions.validUntil,
      })
      .from(this.schema.users)
      .leftJoin(
        this.schema.subscriptions,
        eq(this.schema.users.id, this.schema.subscriptions.userId),
      )
      .where(ne(this.schema.users.email, adminEmail))
      .orderBy(desc(this.schema.users.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data: usersData,
      total: totalCount.value,
    };
  }

  async deleteUser(id: string): Promise<void> {
    await this.db.delete(this.schema.users).where(eq(this.schema.users.id, id));
  }
}
