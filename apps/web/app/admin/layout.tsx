"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Settings, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QueryErrorState } from "@/components/query-error-state";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { useAdminAccess } from "./_hooks/use-admin-access";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { logout, verify } = useAuth();
    const { isAdmin, isLoading, isAuthError, authError } = useAdminAccess();
    const pathname = usePathname();

    if (isAuthError && authError) {
        return (
            <div className="min-h-screen bg-slate-950 p-6">
                <QueryErrorState
                    error={authError}
                    title="Nao foi possivel validar o acesso administrativo"
                    description="A sessao nao foi confirmada por uma falha operacional. Tente novamente."
                    onRetry={() => {
                        void verify();
                    }}
                    fullHeight
                />
            </div>
        );
    }

    if (isLoading || !isAdmin) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
                <div className="animate-pulse text-lg font-medium tracking-tight">
                    Validando acesso restrito...
                </div>
            </div>
        );
    }

    const isSettings = pathname?.startsWith("/admin/settings");

    return (
        <div className="min-h-screen bg-[#020617] p-8 lg:p-12 space-y-10">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-white tracking-tighter">Painel Admin</h1>
                    <p className="text-slate-400 mt-2">Visao consolidada do Rotta</p>
                </div>

                <div className="bg-slate-900/50 p-1 rounded-2xl border border-white/5 flex gap-1">
                    <Link
                        href="/admin"
                        className={cn(
                            "px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                            !isSettings
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                                : "text-slate-400 hover:text-white",
                        )}
                    >
                        <Users size={18} />
                        Usuarios
                    </Link>
                    <Link
                        href="/admin/settings"
                        className={cn(
                            "px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                            isSettings
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                                : "text-slate-400 hover:text-white",
                        )}
                    >
                        <Settings size={18} />
                        Configuracoes
                    </Link>
                </div>

                <Button
                    onClick={logout}
                    variant="ghost"
                    className="group bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/20 rounded-2xl px-6 py-6 transition-all"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
                            <LogOut size={18} className="text-red-500" />
                        </div>
                        <div className="text-left">
                            <div className="text-sm font-bold text-white leading-none">Sair do Painel</div>
                            <div className="text-[10px] text-red-500/60 font-medium mt-0.5">Encerrar sessao</div>
                        </div>
                    </div>
                </Button>
            </header>

            {children}
        </div>
    );
}
