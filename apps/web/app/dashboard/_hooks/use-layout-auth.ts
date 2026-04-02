"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { User } from "@/hooks/use-auth";
import { resolveDashboardRedirect } from "./layout-access";

interface UseLayoutAuthProps {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    isAuthError: boolean;
}

export function useLayoutAuth({
    user,
    isLoading,
    isAuthenticated,
    isAuthError,
}: UseLayoutAuthProps) {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (isLoading || isAuthError) {
            return;
        }

        const redirectTo = resolveDashboardRedirect({
            pathname,
            isAuthenticated,
            user,
        });

        if (redirectTo && redirectTo !== pathname) {
            router.replace(redirectTo);
        }
    }, [isAuthenticated, isAuthError, isLoading, pathname, router, user]);
}
