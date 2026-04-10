'use client';

import { AdminLoginForm } from './admin-login-form';
import { useAdminLogin } from '../_hooks/use-admin-login';

function AdminLoginLoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-red-500/20 border-t-red-500" />
    </div>
  );
}

export function AdminLoginPage() {
  const { error, isSubmitting, isCheckingSession, submit } = useAdminLogin();

  if (isCheckingSession) {
    return <AdminLoginLoadingState />;
  }

  return (
    <AdminLoginForm
      error={error}
      isSubmitting={isSubmitting}
      onSubmit={submit}
    />
  );
}
