import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_PROVIDER } from '../cache/interfaces/cache-provider.interface';
import type { ICacheProvider } from '../cache/interfaces/cache-provider.interface';
import { FinanceService } from './finance.service';
import { FinanceSummaryService } from './services/finance-summary.service';
import { FinanceTrendsService } from './services/finance-trends.service';
import { FinanceBreakdownService } from './services/finance-breakdown.service';

type SummaryServiceMock = {
  getSummary: jest.MockedFunction<FinanceSummaryService['getSummary']>;
};

type TrendsServiceMock = {
  getTrends: jest.MockedFunction<FinanceTrendsService['getTrends']>;
};

type BreakdownServiceMock = {
  getByClient: jest.MockedFunction<FinanceBreakdownService['getByClient']>;
  getByStatus: jest.MockedFunction<FinanceBreakdownService['getByStatus']>;
  getRecentRides: jest.MockedFunction<
    FinanceBreakdownService['getRecentRides']
  >;
  getReportRides: jest.MockedFunction<
    FinanceBreakdownService['getReportRides']
  >;
};

describe('FinanceService', () => {
  let service: FinanceService;
  let summaryServiceMock: SummaryServiceMock;
  let trendsServiceMock: TrendsServiceMock;
  let breakdownServiceMock: BreakdownServiceMock;
  let cacheMock: jest.Mocked<ICacheProvider>;

  beforeEach(async () => {
    summaryServiceMock = {
      getSummary: jest.fn().mockResolvedValue({ totalValue: 42 }),
    };
    trendsServiceMock = {
      getTrends: jest
        .fn()
        .mockResolvedValue([{ date: '2026-03-29', value: 42 }]),
    };
    breakdownServiceMock = {
      getByClient: jest
        .fn()
        .mockResolvedValue([{ clientId: 'client-1', value: 42 }]),
      getByStatus: jest.fn().mockResolvedValue([{ status: 'PAID', value: 42 }]),
      getRecentRides: jest
        .fn()
        .mockResolvedValue([{ id: 'ride-1', value: 42 }]),
      getReportRides: jest
        .fn()
        .mockResolvedValue([{ id: 'ride-2', value: 84 }]),
    };
    cacheMock = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
      getDel: jest.fn().mockResolvedValue(null),
      invalidatePrefix: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinanceService,
        {
          provide: CACHE_PROVIDER,
          useValue: cacheMock,
        },
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

  it('should return a cached dashboard without recomputing the aggregates', async () => {
    const cachedDashboard = {
      summary: {
        totalValue: 420,
        count: 5,
        ticketMedio: 84,
        previousPeriodComparison: 0,
        projection: 0,
      },
      trends: [{ date: '2026-03-29', value: 420 }],
      byClient: [{ clientId: 'client-1', clientName: 'Alice', value: 420 }],
      byStatus: [{ status: 'PAID' as const, value: 420 }],
      recentRides: [
        {
          id: 'ride-1',
          value: 420,
          rideDate: '2026-03-29T12:00:00.000Z',
          paymentStatus: 'PAID' as const,
          clientName: 'Alice',
        },
      ],
    };
    cacheMock.get.mockResolvedValueOnce(cachedDashboard);

    const result = await service.getDashboard('user-1', {
      period: 'month',
      clientId: 'all',
      paymentStatus: 'PAID',
    });

    expect(result).toEqual(cachedDashboard);
    expect(summaryServiceMock.getSummary).not.toHaveBeenCalled();
    expect(trendsServiceMock.getTrends).not.toHaveBeenCalled();
    expect(breakdownServiceMock.getByClient).not.toHaveBeenCalled();
    expect(breakdownServiceMock.getByStatus).not.toHaveBeenCalled();
    expect(breakdownServiceMock.getRecentRides).not.toHaveBeenCalled();
  });

  it('should compose the dashboard payload from focused services', async () => {
    const result = await service.getDashboard('user-1', {
      period: 'month',
      clientId: 'all',
      paymentStatus: 'PENDING',
    });

    expect(summaryServiceMock.getSummary).toHaveBeenCalledWith(
      'user-1',
      expect.any(Date),
      expect.any(Date),
      'month',
      undefined,
      'PENDING',
    );
    expect(trendsServiceMock.getTrends).toHaveBeenCalledWith(
      'user-1',
      expect.any(Date),
      expect.any(Date),
      undefined,
      'PENDING',
    );
    expect(breakdownServiceMock.getByClient).toHaveBeenCalledWith(
      'user-1',
      expect.any(Date),
      expect.any(Date),
      'PENDING',
    );
    expect(breakdownServiceMock.getByStatus).toHaveBeenCalledWith(
      'user-1',
      expect.any(Date),
      expect.any(Date),
      undefined,
      'PENDING',
    );
    expect(breakdownServiceMock.getRecentRides).toHaveBeenCalledWith(
      'user-1',
      expect.any(Date),
      expect.any(Date),
      undefined,
      'PENDING',
    );
    expect(result).toEqual({
      summary: { totalValue: 42 },
      trends: [{ date: '2026-03-29', value: 42 }],
      byClient: [{ clientId: 'client-1', value: 42 }],
      byStatus: [{ status: 'PAID', value: 42 }],
      recentRides: [{ id: 'ride-1', value: 42 }],
    });
    expect(cacheMock.set.mock.calls).toHaveLength(1);
  });

  it('should return the full report payload for the selected filter', async () => {
    const result = await service.getReport('user-1', {
      period: 'custom',
      start: '2026-03-01',
      end: '2026-03-31',
      clientId: 'client-1',
      paymentStatus: 'PAID',
    });
    const [userId, startDate, endDate, clientId, paymentStatus] =
      breakdownServiceMock.getReportRides.mock.calls[0];

    expect(breakdownServiceMock.getReportRides.mock.calls).toHaveLength(1);
    expect(userId).toBe('user-1');
    expect(clientId).toBe('client-1');
    expect(paymentStatus).toBe('PAID');
    expect(startDate.toISOString()).toBe(
      new Date(2026, 2, 1, 0, 0, 0, 0).toISOString(),
    );
    expect(endDate.toISOString()).toBe(
      new Date(2026, 2, 31, 23, 59, 59, 999).toISOString(),
    );
    expect(result.rides).toEqual([{ id: 'ride-2', value: 84 }]);
    expect(result.period.start).toBe(startDate.toISOString());
    expect(result.period.end).toBe(endDate.toISOString());
  });
});
