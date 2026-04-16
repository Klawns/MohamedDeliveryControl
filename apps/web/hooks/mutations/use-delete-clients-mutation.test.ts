import assert from 'node:assert/strict';
import test from 'node:test';

import { clientKeys, financeKeys, rideKeys } from '@/lib/query-keys';
import { invalidateClientCachesAfterBulkDeletion } from './use-delete-clients-mutation';

test('invalidates client, ride, and finance aggregates after bulk client deletion', async () => {
  const invalidated: Array<readonly unknown[]> = [];
  const queryClient: Parameters<typeof invalidateClientCachesAfterBulkDeletion>[0] = {
    invalidateQueries: async (filters) => {
      if (filters?.queryKey) {
        invalidated.push(filters.queryKey);
      }
    },
  };

  await invalidateClientCachesAfterBulkDeletion(queryClient);

  assert.deepEqual(invalidated, [
    clientKeys.lists(),
    clientKeys.directories(),
    [...rideKeys.all, 'stats'],
    rideKeys.frequentClients(),
    financeKeys.all,
  ]);
});
