/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument -- Drizzle is consumed through a dialect-agnostic runtime boundary in this service. */
import { Injectable } from '@nestjs/common';
import { and, desc, eq, sql } from 'drizzle-orm';
import type {
  FinanceByClientItem,
  FinanceByStatusItem,
  GetFinanceStatsDto,
  RecentRideItem,
} from '../dto/finance.dto';
import { FinanceRideQueryService } from './finance-ride-query.service';

@Injectable()
export class FinanceBreakdownService {
  constructor(
    private readonly financeRideQueryService: FinanceRideQueryService,
  ) {}

  private buildRidesQuery(
    userId: string,
    start: Date,
    end: Date,
    clientId?: string,
    paymentStatus?: GetFinanceStatsDto['paymentStatus'],
  ) {
    const conditions =
      this.financeRideQueryService.buildFinancialRideConditions(
        userId,
        start,
        end,
        clientId,
        paymentStatus,
      );

    return this.financeRideQueryService.db
      .select({
        id: this.financeRideQueryService.schema.rides.id,
        value: this.financeRideQueryService.schema.rides.value,
        rideDate: this.financeRideQueryService.schema.rides.rideDate,
        paymentStatus: this.financeRideQueryService.schema.rides.paymentStatus,
        location: this.financeRideQueryService.schema.rides.location,
        clientName: this.financeRideQueryService.schema.clients.name,
      })
      .from(this.financeRideQueryService.schema.rides)
      .leftJoin(
        this.financeRideQueryService.schema.clients,
        eq(
          this.financeRideQueryService.schema.rides.clientId,
          this.financeRideQueryService.schema.clients.id,
        ),
      )
      .where(and(...conditions))
      .orderBy(desc(this.financeRideQueryService.schema.rides.rideDate));
  }

  async getByClient(
    userId: string,
    start: Date,
    end: Date,
    paymentStatus?: GetFinanceStatsDto['paymentStatus'],
  ): Promise<FinanceByClientItem[]> {
    const conditions =
      this.financeRideQueryService.buildFinancialRideConditions(
        userId,
        start,
        end,
        undefined,
        paymentStatus,
      );

    const results = await this.financeRideQueryService.db
      .select({
        clientId: this.financeRideQueryService.schema.rides.clientId,
        clientName: this.financeRideQueryService.schema.clients.name,
        value: sql<number>`sum(${this.financeRideQueryService.schema.rides.value})`,
      })
      .from(this.financeRideQueryService.schema.rides)
      .leftJoin(
        this.financeRideQueryService.schema.clients,
        eq(
          this.financeRideQueryService.schema.rides.clientId,
          this.financeRideQueryService.schema.clients.id,
        ),
      )
      .where(and(...conditions))
      .groupBy(
        this.financeRideQueryService.schema.rides.clientId,
        this.financeRideQueryService.schema.clients.name,
      )
      .orderBy(
        desc(sql`sum(${this.financeRideQueryService.schema.rides.value})`),
      )
      .limit(5);

    return results.map(
      (result: {
        clientId: string | null;
        clientName: string | null;
        value: number | string | null;
      }) => ({
        clientId: result.clientId,
        clientName: result.clientName || 'Cliente Removido',
        value: Number(result.value || 0),
      }),
    );
  }

  async getByStatus(
    userId: string,
    start: Date,
    end: Date,
    clientId?: string,
    paymentStatus?: GetFinanceStatsDto['paymentStatus'],
  ): Promise<FinanceByStatusItem[]> {
    const conditions =
      this.financeRideQueryService.buildFinancialRideConditions(
        userId,
        start,
        end,
        clientId,
        paymentStatus,
      );

    const results = await this.financeRideQueryService.db
      .select({
        status: this.financeRideQueryService.schema.rides.paymentStatus,
        value: sql<number>`sum(${this.financeRideQueryService.schema.rides.value})`,
      })
      .from(this.financeRideQueryService.schema.rides)
      .where(and(...conditions))
      .groupBy(this.financeRideQueryService.schema.rides.paymentStatus);

    return results.map(
      (result: {
        status: 'PAID' | 'PENDING';
        value: number | string | null;
      }) => ({
        status: result.status,
        value: Number(result.value || 0),
      }),
    );
  }

  getRecentRides(
    userId: string,
    start: Date,
    end: Date,
    clientId?: string,
    paymentStatus?: GetFinanceStatsDto['paymentStatus'],
  ): Promise<RecentRideItem[]> {
    return this.buildRidesQuery(
      userId,
      start,
      end,
      clientId,
      paymentStatus,
    ).limit(10) as Promise<RecentRideItem[]>;
  }

  getReportRides(
    userId: string,
    start: Date,
    end: Date,
    clientId?: string,
    paymentStatus?: GetFinanceStatsDto['paymentStatus'],
  ): Promise<RecentRideItem[]> {
    return this.buildRidesQuery(
      userId,
      start,
      end,
      clientId,
      paymentStatus,
    ) as Promise<RecentRideItem[]>;
  }
}
