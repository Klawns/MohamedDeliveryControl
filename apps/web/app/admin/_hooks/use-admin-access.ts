'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export function useAdminAccess() {
  const { user, isAuthenticated, isLoading, isAuthError, authError } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || isAuthError) {
      return;
    }

    if (!isAuthenticated) {
      router.push('/area-restrita');
      return;
    }

    if (user?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isAuthError, isLoading, router, user]);

  return {
    user,
    isLoading,
    isAdmin: user?.role === 'admin',
    isAuthError,
    authError,
  };
}
