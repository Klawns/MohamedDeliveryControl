import { Test, TestingModule } from '@nestjs/testing';
import { FinanceService } from './finance.service';
import { FinanceSummaryService } from './services/finance-summary.service';
import { FinanceTrendsService } from './services/finance-trends.service';
import { FinanceBreakdownService } from './services/finance-breakdown.service';

describe('FinanceService', () => {
  let service: FinanceService;
  let summaryServiceMock: any;
  let trendsServiceMock: any;
  let breakdownServiceMock: any;

  beforeEach(async () => {
    summaryServiceMock = {
      getSummary: jest.fn().mockResolvedValue({ totalValue: 42 }),
    };
    trendsServiceMock = {
      getTrends: jest.fn().mockResolvedValue([{ date: '2026-03-29', value: 42 }]),
    };
    breakdownServiceMock = {
      getByClient: jest.fn().mockResolvedValue([{ clientId: 'client-1', value: 42 }]),
      getByStatus: jest.fn().mockResolvedValue([{ status: 'PAID', value: 42 }]),
      getRecentRides: jest.fn().mockResolvedValue([{ id: 'ride-1', value: 42 }]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinanceService,
        {
          provide: FinanceSummaryService,
          useValue: summaryServiceMock,
        },
        {
          provide: FinanceTrendsService,
          useValue: trendsServiceMock,
        },
        {
          provide: FinanceBreakdownService,
          useValue: breakdownServiceMock,
        },
      ],
    }).compile();

    service = module.get<FinanceService>(FinanceService);
  });

  it('should compose the dashboard payload from focused services', async () => {
    const result = await service.getDashboard('user-1', {
      period: 'month',
      clientId: 'all',
    });

    expect(summaryServiceMock.getSummary).toHaveBeenCalled();
    expect(trendsServiceMock.getTrends).toHaveBeenCalled();
    expect(breakdownServiceMock.getByClient).toHaveBeenCalled();
    expect(breakdownServiceMock.getByStatus).toHaveBeenCalled();
    expect(breakdownServiceMock.getRecentRides).toHaveBeenCalled();
    expect(result).toEqual({
      summary: { totalValue: 42 },
      trends: [{ date: '2026-03-29', value: 42 }],
      byClient: [{ clientId: 'client-1', value: 42 }],
      byStatus: [{ status: 'PAID', value: 42 }],
      recentRides: [{ id: 'ride-1', value: 42 }],
    });
  });
});
