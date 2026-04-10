import type { QueryClient } from '@tanstack/react-query';

import { authKeys } from '@/lib/query-keys';
import type { User } from './auth.types';

type AuthCacheWriter = Pick<QueryClient, 'setQueryData'>;

export function syncAuthUserCache(
  queryClient: AuthCacheWriter,
  user: User,
): void {
  queryClient.setQueryData(authKeys.user(), user);
}
