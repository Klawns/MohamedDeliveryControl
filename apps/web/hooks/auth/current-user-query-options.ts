import type { UseQueryOptions } from '@tanstack/react-query';

import { authKeys } from '../../lib/query-keys';
import { apiClient } from '../../services/api';
import type { User } from './auth.types';

export interface UseCurrentUserQueryOptions {
  enabled?: boolean;
  refetchOnWindowFocus?: boolean | 'always';
  refetchOnReconnect?: boolean | 'always';
}

export const AUTH_QUERY_STALE_TIME_MS = 1000 * 60 * 5;
export const AUTH_QUERY_POLL_INTERVAL_MS = 1000 * 30;

export function buildCurrentUserQueryOptions(
  options?: UseCurrentUserQueryOptions,
): UseQueryOptions<User, Error, User, ReturnType<typeof authKeys.user>> {
  const enabled = options?.enabled ?? true;
  const refetchInterval: number | false = enabled
    ? AUTH_QUERY_POLL_INTERVAL_MS
    : false;

  return {
    queryKey: authKeys.user(),
    queryFn: () => apiClient.get<User>('/auth/me', { _skipRedirect: true }),
    staleTime: AUTH_QUERY_STALE_TIME_MS,
    retry: false,
    enabled,
    refetchInterval,
    refetchIntervalInBackground: enabled,
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? 'always',
    refetchOnReconnect: options?.refetchOnReconnect ?? 'always',
  };
}
