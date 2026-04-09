"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authKeys } from "@/lib/query-keys";
import { authService } from "@/services/auth-service";
import { apiClient } from "@/services/api";
import { useCurrentUserQuery } from "@/hooks/auth/use-current-user-query";
import { resetAuthQueryCache } from "@/hooks/auth/reset-auth-query-cache";
import { useUnauthorizedRedirect } from "@/hooks/auth/use-unauthorized-redirect";
import type { User } from "@/hooks/auth/auth.types";
import { isApiErrorStatus } from "@/lib/api-error";
export type { User } from "@/hooks/auth/auth.types";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAuthError: boolean;
  authError: unknown | null;
  login: (user: User, redirectTo?: string) => void;
  updateUser: (user: User) => void;
  logout: () => void;
  verify: () => Promise<User | null>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const isPublicAuthRoute =
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/area-restrita';
  const currentUserQuery = useCurrentUserQuery({
    enabled: !isPublicAuthRoute,
  });
  const isUnauthorized = isApiErrorStatus(currentUserQuery.error, 401);
  const user = isUnauthorized ? null : currentUserQuery.data ?? null;
  const authError =
    currentUserQuery.isError && !isUnauthorized
      ? currentUserQuery.error
      : null;
  const isAuthError = authError !== null;

  const isLoading = currentUserQuery.isLoading;

  const logoutMutation = useMutation({
    mutationFn: () => apiClient.post("/auth/logout"),
    onSettled: () => {
      authService.resetRedirectLock();
      resetAuthQueryCache(queryClient);
      router.replace(pathname?.startsWith("/admin") ? "/area-restrita" : "/login");
    },
  });

  useEffect(() => {
    if (user) {
      authService.resetRedirectLock();
    }
  }, [user]);

  useUnauthorizedRedirect({
    pathname,
    search: searchParams.toString(),
    queryClient,
    replace: router.replace,
  });

  const login = useCallback(
    (userData: User, redirectTo?: string) => {
      authService.resetRedirectLock();
      queryClient.setQueryData(authKeys.user(), userData);
      router.replace(redirectTo || "/dashboard");
    },
    [queryClient, router],
  );

  const updateUser = useCallback(
    (userData: User) => {
      queryClient.setQueryData(authKeys.user(), userData);
    },
    [queryClient],
  );

  const logout = useCallback(() => {
    logoutMutation.mutate();
  }, [logoutMutation]);

  const verify = useCallback(async () => {
    const result = await currentUserQuery.refetch();

    if (result.error) {
      if (isApiErrorStatus(result.error, 401)) {
        return null;
      }

      throw result.error;
    }

    return result.data ?? null;
  }, [currentUserQuery]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isAuthError,
      authError,
      login,
      updateUser,
      logout,
      verify,
      isLoading,
    }),
    [user, isAuthError, authError, login, updateUser, logout, verify, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }

  return context;
};
