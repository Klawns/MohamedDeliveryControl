'use client';

import { useCurrentUserQuery } from '@/hooks/auth/use-current-user-query';
import { resolveAdminRedirect } from '../_lib/admin-auth.rules';

interface AdminSessionGateState {
  redirectTo: string | null;
  isCheckingSession: boolean;
}

export function useAdminSessionGate(): AdminSessionGateState {
  const sessionQuery = useCurrentUserQuery({
    enabled: true,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const redirectTo = sessionQuery.data
    ? resolveAdminRedirect(sessionQuery.data.role)
    : null;

  return {
    redirectTo,
    isCheckingSession: sessionQuery.isLoading || redirectTo !== null,
  };
}
