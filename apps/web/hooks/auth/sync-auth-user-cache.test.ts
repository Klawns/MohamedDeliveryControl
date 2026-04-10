import assert from 'node:assert/strict';
import test from 'node:test';

import { authKeys } from '@/lib/query-keys';
import type { User } from './auth.types';
import { syncAuthUserCache } from './sync-auth-user-cache';

test('writes the authenticated user to the auth query cache', () => {
  const calls: Array<{ queryKey: readonly unknown[]; data: User }> = [];
  const user: User = {
    id: 'user-1',
    email: 'admin@mdc.com',
    name: 'Admin',
    role: 'admin',
    hasSeenTutorial: true,
  };

  syncAuthUserCache(
    {
      setQueryData(queryKey, data) {
        calls.push({ queryKey, data: data as User });
        return data;
      },
    },
    user,
  );

  assert.deepEqual(calls, [{ queryKey: authKeys.user(), data: user }]);
});
