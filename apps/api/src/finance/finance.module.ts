import { Module } from '@nestjs/common';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { FinanceRideQueryService } from './services/finance-ride-query.service';
import { FinanceSummaryService } from './services/finance-summary.service';
import { FinanceTrendsService } from './services/finance-trends.service';
import { FinanceBreakdownService } from './services/finance-breakdown.service';

@Module({
  imports: [SubscriptionsModule],
  controllers: [FinanceController],
  providers: [
    FinanceService,
    FinanceRideQueryService,
    FinanceSummaryService,
    FinanceTrendsService,
    FinanceBreakdownService,
  ],
  exports: [FinanceService],
})
export class FinanceModule {}
