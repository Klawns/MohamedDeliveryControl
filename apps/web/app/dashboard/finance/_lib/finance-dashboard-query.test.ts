import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildFinanceDashboardParams,
  buildFinanceDashboardQueryKey,
} from './finance-dashboard-query';

test('builds finance dashboard params only when custom ranges are complete', () => {
  assert.equal(
    buildFinanceDashboardParams({
      period: 'custom',
      paymentStatus: 'all',
      startDate: '2026-04-01',
    }),
    null,
  );
  assert.deepEqual(
    buildFinanceDashboardParams(
      {
        period: 'custom',
        paymentStatus: 'PAID',
        startDate: '2026-04-01',
        endDate: '2026-04-03',
      },
      'client-1',
    ),
      {
        period: 'custom',
        clientId: 'client-1',
        paymentStatus: 'PAID',
        start: '2026-04-01',
        end: '2026-04-03',
      },
  );
  assert.deepEqual(
    buildFinanceDashboardQueryKey(
      {
        period: 'month',
        paymentStatus: 'all',
      },
      'client-1',
    ),
    {
      period: 'month',
      clientId: 'client-1',
      paymentStatus: 'all',
      start: undefined,
      end: undefined,
    },
  );
});
