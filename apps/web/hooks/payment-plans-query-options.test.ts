import assert from 'node:assert/strict';
import test from 'node:test';

import {
  PAYMENT_PLANS_QUERY_POLL_INTERVAL_MS,
  PAYMENT_PLANS_QUERY_STALE_TIME_MS,
  buildPaymentPlansQueryOptions,
  invalidatePlanCachesAfterAdminUpdate,
} from './payment-plans-query-options';
import { adminKeys, paymentKeys } from '../lib/query-keys';

test('keeps payment plans fresher than the server-side cache invalidation window', () => {
  const options = buildPaymentPlansQueryOptions();

  assert.equal(options.staleTime, PAYMENT_PLANS_QUERY_STALE_TIME_MS);
  assert.equal(options.refetchInterval, PAYMENT_PLANS_QUERY_POLL_INTERVAL_MS);
  assert.equal(options.refetchOnWindowFocus, 'always');
  assert.equal(options.refetchOnReconnect, 'always');
});

test('invalidates admin and public pricing queries together after a plan update', async () => {
  const invalidated: Array<readonly unknown[]> = [];
  const queryClient = {
    invalidateQueries: async ({ queryKey }: { queryKey: readonly unknown[] }) => {
      invalidated.push(queryKey);
    },
  };

  await invalidatePlanCachesAfterAdminUpdate(queryClient);

  assert.deepEqual(invalidated, [
    adminKeys.plans(),
    adminKeys.usersAll(),
    paymentKeys.plans(),
  ]);
});

test('still attempts every invalidation before surfacing a failure', async () => {
  const attempted: Array<readonly unknown[]> = [];
  const queryClient = {
    invalidateQueries: ({ queryKey }: { queryKey: readonly unknown[] }) => {
      attempted.push(queryKey);

      if (JSON.stringify(queryKey) === JSON.stringify(paymentKeys.plans())) {
        return Promise.reject(new Error('payment invalidation failed'));
      }

      return Promise.resolve();
    },
  };

  await assert.rejects(
    () => invalidatePlanCachesAfterAdminUpdate(queryClient),
    /payment invalidation failed/,
  );

  assert.deepEqual(attempted, [
    adminKeys.plans(),
    adminKeys.usersAll(),
    paymentKeys.plans(),
  ]);
});
