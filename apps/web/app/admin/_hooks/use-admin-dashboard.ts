'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminKeys } from '@/lib/query-keys';
import { adminService } from '@/services/admin-service';
import { AdminRecentUser } from '@/types/admin';

export function useAdminDashboard(currentPage: number, enabled: boolean) {
  const queryClient = useQueryClient();

  const statsQuery = useQuery({
    queryKey: adminKeys.stats(),
    queryFn: ({ signal }) => adminService.getStats(signal),
    enabled,
  });

  const usersQuery = useQuery({
    queryKey: adminKeys.users({ page: currentPage, limit: 10 }),
    queryFn: ({ signal }) =>
      adminService.getRecentUsers(
        {
          page: currentPage,
          limit: 10,
        },
        signal,
      ),
    enabled,
  });

  const updatePlanMutation = useMutation({
    mutationFn: adminService.updateUserPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.usersAll() });
    },
  });

  return {
    stats: statsQuery.data,
    statsError: statsQuery.error ?? null,
    isStatsPending: statsQuery.isPending,
    refetchStats: statsQuery.refetch,
    users: usersQuery.data?.data,
    pagination: usersQuery.data?.meta,
    usersError: usersQuery.error ?? null,
    isUsersPending: usersQuery.isPending,
    refetchUsers: usersQuery.refetch,
    isUpdatingUserPlan: updatePlanMutation.isPending,
    handleUpdateUserPlan: (
      user: AdminRecentUser,
      plan: 'starter' | 'premium' | 'lifetime',
    ) =>
      updatePlanMutation.mutateAsync({
        userId: user.id,
        plan,
      }),
  };
}
