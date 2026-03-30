/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument -- Drizzle is consumed through a dialect-agnostic runtime boundary in this service. */
import { Injectable } from '@nestjs/common';
import { and, sql } from 'drizzle-orm';
import { FinanceRideQueryService } from './finance-ride-query.service';

@Injectable()
export class FinanceSummaryService {
  constructor(
    private readonly financeRideQueryService: FinanceRideQueryService,
  ) {}

  async getSummary(
    userId: string,
    start: Date,
    end: Date,
    period: string,
    clientId?: string,
  ) {
    const conditions = this.financeRideQueryService.buildFinancialRideConditions(
      userId,
      start,
      end,
      clientId,
    );

    const stats = await this.financeRideQueryService.db
      .select({
        count: sql<number>`count(*)`,
        total: sql<number>`coalesce(sum(${this.financeRideQueryService.schema.rides.value}), 0)`,
      })
      .from(this.financeRideQueryService.schema.rides)
      .where(and(...conditions));

    const currentTotal = Number(stats[0]?.total || 0);
    const currentCount = Number(stats[0]?.count || 0);
    const ticketMedio = currentCount > 0 ? currentTotal / currentCount : 0;

    return {
      totalValue: currentTotal,
      count: currentCount,
      ticketMedio,
      previousPeriodComparison: await this.getPreviousPeriodComparison(
        userId,
        start,
        end,
        period,
        clientId,
      ),
      projection: this.calculateProjection(currentTotal, start, end, period),
    };
  }

  private async getPreviousPeriodComparison(
    userId: string,
    start: Date,
    end: Date,
    period: string,
    clientId?: string,
  ) {
    if (period === 'custom') {
      return 0;
    }

    const diff = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - diff - 1);
    const prevEnd = new Date(start.getTime() - 1);
    const previousTotal = await this.getCurrentTotal(
      userId,
      prevStart,
      prevEnd,
      clientId,
    );
    const currentTotal = await this.getCurrentTotal(userId, start, end, clientId);

    if (previousTotal === 0) {
      return currentTotal > 0 ? 100 : 0;
    }

    return ((currentTotal - previousTotal) / previousTotal) * 100;
  }

  private async getCurrentTotal(
    userId: string,
    start: Date,
    end: Date,
    clientId?: string,
  ) {
    const conditions = this.financeRideQueryService.buildFinancialRideConditions(
      userId,
      start,
      end,
      clientId,
    );

    const stats = await this.financeRideQueryService.db
      .select({
        total: sql<number>`coalesce(sum(${this.financeRideQueryService.schema.rides.value}), 0)`,
      })
      .from(this.financeRideQueryService.schema.rides)
      .where(and(...conditions));

    return Number(stats[0]?.total || 0);
  }

  private calculateProjection(
    currentTotal: number,
    start: Date,
    end: Date,
    period: string,
  ) {
    if (period !== 'month') {
      return 0;
    }

    const today = new Date();
    if (today > end || today < start) {
      return 0;
    }

    const daysPassed = today.getDate();
    const totalDays = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0,
    ).getDate();

    if (daysPassed === 0) {
      return 0;
    }

    return (currentTotal / daysPassed) * totalDays;
  }
}
