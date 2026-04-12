/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Drizzle is consumed through a dialect-agnostic runtime boundary in this service. */
import { Injectable, Inject } from '@nestjs/common';
import { eq, gte, lte, ne } from 'drizzle-orm';
import type { GetFinanceStatsDto } from '../dto/finance.dto';
import { DRIZZLE } from '../../database/database.provider';
import type { DrizzleClient } from '../../database/database.provider';

@Injectable()
export class FinanceRideQueryService {
  constructor(
    @Inject(DRIZZLE)
    private readonly drizzle: DrizzleClient,
  ) {}

  get db() {
    return this.drizzle.db;
  }

  get schema() {
    return this.drizzle.schema;
  }

  toDateValue(value: unknown): Date | null {
    return value instanceof Date
      ? value
      : value
        ? new Date(value as string)
        : null;
  }

  buildFinancialRideConditions(
    userId: string,
    start: Date,
    end: Date,
    clientId?: string,
    paymentStatus?: GetFinanceStatsDto['paymentStatus'],
  ) {
    const conditions = [
      eq(this.schema.rides.userId, userId),
      gte(this.schema.rides.rideDate, start),
      lte(this.schema.rides.rideDate, end),
      ne(this.schema.rides.status, 'CANCELLED'),
    ];

    if (clientId) {
      conditions.push(eq(this.schema.rides.clientId, clientId));
    }

    if (paymentStatus) {
      conditions.push(eq(this.schema.rides.paymentStatus, paymentStatus));
    }

    return conditions;
  }
}
