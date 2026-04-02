'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminKeys } from '@/lib/query-keys';
import { parseApiError } from '@/lib/api-error';
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

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => adminService.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.usersAll() });
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
    },
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
    handleDeleteUser: (userId: string) =>
      deleteUserMutation.mutateAsync(userId),
    handleUpdateUserPlan: (
      user: AdminRecentUser,
      plan: 'starter' | 'premium' | 'lifetime',
    ) =>
      updatePlanMutation.mutateAsync({
        userId: user.id,
        plan,
      }),
    deleteUserError: deleteUserMutation.error
      ? parseApiError(deleteUserMutation.error)
      : null,
    updatePlanError: updatePlanMutation.error
      ? parseApiError(updatePlanMutation.error)
      : null,
  };
}
