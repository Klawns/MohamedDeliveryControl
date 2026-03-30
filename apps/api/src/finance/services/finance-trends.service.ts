/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument -- Drizzle is consumed through a dialect-agnostic runtime boundary in this service. */
import { Injectable } from '@nestjs/common';
import { and } from 'drizzle-orm';
import { getDaysArray } from '../../common/utils/date.util';
import { FinanceRideQueryService } from './finance-ride-query.service';

@Injectable()
export class FinanceTrendsService {
  constructor(
    private readonly financeRideQueryService: FinanceRideQueryService,
  ) {}

  async getTrends(userId: string, start: Date, end: Date, clientId?: string) {
    const conditions = this.financeRideQueryService.buildFinancialRideConditions(
      userId,
      start,
      end,
      clientId,
    );

    const rides = await this.financeRideQueryService.db
      .select({
        rideDate: this.financeRideQueryService.schema.rides.rideDate,
        value: this.financeRideQueryService.schema.rides.value,
      })
      .from(this.financeRideQueryService.schema.rides)
      .where(and(...conditions));

    const trendMap = new Map<string, number>();

    rides.forEach(
      (ride: {
        rideDate: Date | string | null;
        value: number | string | null;
      }) => {
        if (!ride.rideDate) {
          return;
        }

        const dateValue = this.financeRideQueryService.toDateValue(ride.rideDate);
        if (!dateValue) {
          return;
        }

        const dateKey = `${dateValue.getFullYear()}-${String(dateValue.getMonth() + 1).padStart(2, '0')}-${String(dateValue.getDate()).padStart(2, '0')}`;
        trendMap.set(
          dateKey,
          (trendMap.get(dateKey) || 0) + Number(ride.value || 0),
        );
      },
    );

    return getDaysArray(start, end).map((date) => ({
      date,
      value: trendMap.get(date) || 0,
    }));
  }
}
