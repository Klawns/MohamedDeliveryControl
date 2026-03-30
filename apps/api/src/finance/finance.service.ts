import { Injectable } from '@nestjs/common';
import { getDatesFromPeriod } from '../common/utils/date.util';
import type { GetFinanceStatsDto } from './dto/finance.dto';
import { FinanceSummaryService } from './services/finance-summary.service';
import { FinanceTrendsService } from './services/finance-trends.service';
import { FinanceBreakdownService } from './services/finance-breakdown.service';

@Injectable()
export class FinanceService {
  constructor(
    private readonly financeSummaryService: FinanceSummaryService,
    private readonly financeTrendsService: FinanceTrendsService,
    private readonly financeBreakdownService: FinanceBreakdownService,
  ) {}

  async getDashboard(userId: string, query: GetFinanceStatsDto) {
    const { startDate, endDate } = getDatesFromPeriod(
      query.period,
      query.start,
      query.end,
    );
    const clientId =
      query.clientId && query.clientId !== 'all' ? query.clientId : undefined;

    const [summary, trends, byClient, byStatus, recentRides] = await Promise.all([
      this.financeSummaryService.getSummary(
        userId,
        startDate,
        endDate,
        query.period,
        clientId,
      ),
      this.financeTrendsService.getTrends(userId, startDate, endDate, clientId),
      this.financeBreakdownService.getByClient(userId, startDate, endDate),
      this.financeBreakdownService.getByStatus(
        userId,
        startDate,
        endDate,
        clientId,
      ),
      this.financeBreakdownService.getRecentRides(
        userId,
        startDate,
        endDate,
        clientId,
      ),
    ]);

    return {
      summary,
      trends,
      byClient,
      byStatus,
      recentRides,
    };
  }
}
