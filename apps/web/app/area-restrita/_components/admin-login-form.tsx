'use client';

import type { FormEvent } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Lock, Mail } from 'lucide-react';
import Link from 'next/link';
import type { AdminLoginCredentials } from '../_lib/admin-auth.types';

interface AdminLoginFormProps {
  error: string | null;
  isSubmitting: boolean;
  onSubmit: (credentials: AdminLoginCredentials) => void;
}

function toAdminLoginCredentials(
  event: FormEvent<HTMLFormElement>,
): AdminLoginCredentials {
  const formData = new FormData(event.currentTarget);

  return {
    email: String(formData.get('email') ?? '').trim(),
    password: String(formData.get('password') ?? ''),
  };
}

export function AdminLoginForm({
  error,
  isSubmitting,
  onSubmit,
}: AdminLoginFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(toAdminLoginCredentials(event));
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 p-6">
      <div className="absolute left-0 top-0 h-full w-full opacity-30">
        <div className="absolute left-[-10%] top-[-10%] h-[50%] w-[50%] rounded-full bg-red-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[50%] w-[50%] rounded-full bg-slate-500/10 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 w-full max-w-md"
      >
        <div className="glass-card rounded-3xl border border-red-500/10 bg-slate-900/40 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-8 text-center">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="mb-4 inline-block rounded-2xl bg-red-500/10 p-4"
            >
              <Lock className="h-10 w-10 text-red-500" />
            </motion.div>

            <h1 className="mb-2 text-3xl font-black uppercase italic tracking-tight text-white">
              Rotta Admin
            </h1>
            <p className="text-sm text-slate-400">
              Acesso exclusivo para administradores
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error ? (
              <div
                role="alert"
                className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-center text-sm font-medium text-red-400"
              >
                {error}
              </div>
            ) : null}

            <div className="space-y-2">
              <label
                htmlFor="admin-email"
                className="ml-1 text-xs font-bold uppercase tracking-widest text-slate-500"
              >
                E-mail Admin
              </label>

              <div className="group relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-600 transition-colors group-focus-within:text-red-400">
                  <Mail size={18} />
                </div>

                <input
                  id="admin-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="admin@mdc.com"
                  className="w-full rounded-xl border border-white/5 bg-slate-950/50 py-4 pl-11 pr-4 font-medium text-white transition-all focus:border-red-500/30 focus:outline-none focus:ring-2 focus:ring-red-500/30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="admin-password"
                className="ml-1 text-xs font-bold uppercase tracking-widest text-slate-500"
              >
                Chave de Acesso
              </label>

              <div className="group relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-600 transition-colors group-focus-within:text-red-400">
                  <Lock size={18} />
                </div>

                <input
                  id="admin-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="********"
                  className="w-full rounded-xl border border-white/5 bg-slate-950/50 py-4 pl-11 pr-4 font-medium text-white transition-all focus:border-red-500/30 focus:outline-none focus:ring-2 focus:ring-red-500/30"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 py-4 font-bold text-white shadow-xl shadow-red-600/20 transition-all hover:from-red-500 hover:to-red-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  Autenticar Sistema
                  <ArrowRight
                    className="transition-transform group-hover:translate-x-1"
                    size={18}
                  />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link
              href="/login"
              className="text-xs text-slate-500 transition-colors hover:text-slate-300"
            >
              Voltar para o Login Publico
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
