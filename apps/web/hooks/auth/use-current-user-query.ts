'use client';

import { useQuery } from '@tanstack/react-query';
import { authKeys } from '@/lib/query-keys';
import { apiClient } from '@/services/api';
import { type User } from '@/hooks/use-auth';

interface UseCurrentUserQueryOptions {
  enabled?: boolean;
  refetchOnWindowFocus?: boolean | 'always';
  refetchOnReconnect?: boolean | 'always';
}

export function useCurrentUserQuery(options?: UseCurrentUserQueryOptions) {
  return useQuery({
    queryKey: authKeys.user(),
    queryFn: () => apiClient.get<User>('/auth/me', { _skipRedirect: true }),
    staleTime: 1000 * 60 * 5,
    retry: false,
    enabled: options?.enabled ?? true,
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? true,
    refetchOnReconnect: options?.refetchOnReconnect ?? true,
  });
}
