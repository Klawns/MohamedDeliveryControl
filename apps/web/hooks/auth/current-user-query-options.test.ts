import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AUTH_QUERY_POLL_INTERVAL_MS,
  AUTH_QUERY_STALE_TIME_MS,
  buildCurrentUserQueryOptions,
} from './current-user-query-options';

test('keeps auth/me synchronized with asynchronous backend invalidations while enabled', () => {
  const options = buildCurrentUserQueryOptions();

  assert.equal(options.staleTime, AUTH_QUERY_STALE_TIME_MS);
  assert.equal(options.refetchInterval, AUTH_QUERY_POLL_INTERVAL_MS);
  assert.equal(options.refetchIntervalInBackground, true);
  assert.equal(options.refetchOnWindowFocus, 'always');
  assert.equal(options.refetchOnReconnect, 'always');
});

test('disables background freshness work when the auth query is disabled', () => {
  const options = buildCurrentUserQueryOptions({ enabled: false });

  assert.equal(options.enabled, false);
  assert.equal(options.refetchInterval, false);
  assert.equal(options.refetchIntervalInBackground, false);
});
