'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { parseApiError } from '@/lib/api-error';
import { adminService } from '@/services/admin-service';
import { type AdminRecentUser } from '@/types/admin';
import { invalidateAdminDashboardQueries } from '../_lib/admin-dashboard-query-cache';
import {
  DELETE_CONFIRMATION_TEXT,
  canDeleteUser,
  normalizeDangerousActionInput,
} from '../_lib/dangerous-action.rules';

interface UseDeleteUserDialogOptions {
  user: Pick<AdminRecentUser, 'id' | 'name' | 'email'> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function useDeleteUserDialog({
  user,
  open,
  onOpenChange,
}: UseDeleteUserDialogOptions) {
  const queryClient = useQueryClient();
  const [confirmationValue, setConfirmationValue] = useState('');

  const {
    mutate: deleteUser,
    error: deleteUserError,
    isPending: isDeleting,
  } = useMutation({
    mutationFn: (userId: string) => adminService.deleteUser(userId),
    onSuccess: () => invalidateAdminDashboardQueries(queryClient),
  });

  const isOpen = open && Boolean(user);
  const isConfirmationValid = canDeleteUser(confirmationValue);
  const error = deleteUserError
    ? parseApiError(deleteUserError, 'Erro ao excluir usuario.')
    : null;

  const handleOpenChange = (nextOpen: boolean) => {
    if (isDeleting) {
      return;
    }

    onOpenChange(nextOpen);
  };

  const handleConfirmationChange = (value: string) => {
    setConfirmationValue(normalizeDangerousActionInput(value));
  };

  const handleConfirm = () => {
    if (!user || !isConfirmationValid || isDeleting) {
      return;
    }

    deleteUser(user.id, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  return {
    open: isOpen,
    user,
    confirmationValue,
    requiredConfirmationText: DELETE_CONFIRMATION_TEXT,
    error,
    isDeleting,
    isConfirmDisabled: isDeleting || !isConfirmationValid,
    handleOpenChange,
    handleConfirmationChange,
    handleConfirm,
    handleCancel: () => handleOpenChange(false),
  };
}

export type DeleteUserDialogState = ReturnType<typeof useDeleteUserDialog>;
