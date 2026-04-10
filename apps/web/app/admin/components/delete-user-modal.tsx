'use client';

import { type AdminRecentUser } from '@/types/admin';
import { useDeleteUserDialog } from '../_hooks/use-delete-user-dialog';
import { DeleteUserModalView } from './delete-user-modal-view';

interface DeleteUserModalProps {
  user: Pick<AdminRecentUser, 'id' | 'name' | 'email'> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteUserModal({
  user,
  open,
  onOpenChange,
}: DeleteUserModalProps) {
  const dialogKey = `${user?.id ?? 'delete-none'}-${open ? 'open' : 'closed'}`;

  return (
    <DeleteUserModalContent
      key={dialogKey}
      user={user}
      open={open}
      onOpenChange={onOpenChange}
    />
  );
}

function DeleteUserModalContent({
  user,
  open,
  onOpenChange,
}: DeleteUserModalProps) {
  const dialog = useDeleteUserDialog({
    user,
    open,
    onOpenChange,
  });

  return <DeleteUserModalView dialog={dialog} />;
}
