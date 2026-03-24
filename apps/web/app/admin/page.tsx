"use client";

import { motion } from "framer-motion";
import { Users, Shield, CreditCard, Search, ArrowUpRight, Trash2, Settings } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, apiClient } from "@/services/api";
import { DeleteUserModal } from "./components/delete-user-modal";
import { CreateUserModal } from "./components/create-user-modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus } from "lucide-react";

export default function AdminDashboardPage() {
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState({ totalUsers: 0, activeSubscriptions: 0, revenue30d: 0 });
    const [recentUsers, setRecentUsers] = useState<any[]>([]);
    const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);

    // Estados para Exclusão
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<any>(null);

    // Estado para Criação
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        if (!authLoading) {
            if (!isAuthenticated) {
                router.push("/area-restrita");
            } else if (user?.role !== "admin") {
                router.push("/dashboard");
            }
        }
    }, [authLoading, isAuthenticated, user, router]);

    useEffect(() => {
        if (user?.role === "admin") {
            loadStats();
        }
    }, [user]);

    useEffect(() => {
        if (user?.role === "admin") {
            loadUsers(currentPage);
        }
    }, [user, currentPage]);

    async function loadStats() {
        try {
            const data = await apiClient.get<any>("/admin/stats");
            setStats(data);
        } catch (error) {
            console.error("Erro ao carregar estatísticas:", error);
        }
    }

    async function loadUsers(page: number) {
        setIsLoading(true);
        try {
            const response = await apiClient.getPaginated<any>(`/admin/users/recent?page=${page}&limit=10`);
            setRecentUsers(response.data);
            setPagination(response.meta);
        } catch (error) {
            console.error("Erro ao carregar usuários:", error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleDeleteUser(userId: string) {
        try {
            await apiClient.delete(`/admin/users/${userId}`);
            // Recarrega os dados após deletar
            loadUsers(currentPage);
            loadStats();
        } catch (error) {
            console.error("Erro ao deletar usuário:", error);
            throw error;
        }
    }

    if (authLoading || user?.role !== "admin") {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
                <div className="animate-pulse text-lg font-medium tracking-tight">Validando acesso restrito...</div>
            </div>
        );
    }

    const adminStats = [
        { label: "Total de Usuários", value: stats.totalUsers || 0, icon: Users, color: "text-blue-400" },
        { label: "Assinaturas Ativas", value: stats.activeSubscriptions || 0, icon: Shield, color: "text-emerald-400" },
        { label: "Receita (30d)", value: formatCurrency((stats.revenue30d || 0) / 100), icon: CreditCard, color: "text-violet-400" },
    ];

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-10 fade-in"
            >
                {/* Admin Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {adminStats.map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="glass-card p-8 rounded-[2rem] border border-white/5 bg-slate-900/40 hover:bg-slate-900/60 transition-all group"
                        >
                            <div className={`p-4 rounded-2xl bg-white/5 w-fit ${stat.color} mb-6 group-hover:scale-110 transition-transform`}>
                                <stat.icon size={28} />
                            </div>
                            <p className="text-slate-400 text-sm font-semibold uppercase tracking-widest">{stat.label}</p>
                            <h3 className="text-4xl font-bold text-white mt-1">{stat.value}</h3>
                        </motion.div>
                    ))}
                </div>

                {/* List Sections */}
                <div className="w-full">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full glass-card rounded-[2rem] border border-white/5 bg-slate-900/40 overflow-hidden"
                    >
                        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
                            <div className="flex items-center gap-6">
                                <h2 className="text-xl font-bold text-white">Usuários Recentes</h2>
                                <button
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20 active:scale-[0.98]"
                                >
                                    <UserPlus size={14} />
                                    Novo Usuário
                                </button>
                            </div>
                            <div className="relative group max-w-xs">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                    <Search size={14} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Buscar usuário..."
                                    className="w-full bg-slate-950/50 border border-white/5 rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                                        <th className="px-8 py-5">Usuário</th>
                                        <th className="px-8 py-5">Email</th>
                                        <th className="px-8 py-5">Plano</th>
                                        <th className="px-8 py-5 text-right">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {isLoading ? (
                                        [1, 2, 3].map(i => (
                                            <tr key={i} className="animate-pulse">
                                                <td colSpan={4} className="px-8 py-6 h-20 bg-white/5" />
                                            </tr>
                                        ))
                                    ) : recentUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-10 text-center text-slate-500 italic">Nenhum usuário encontrado.</td>
                                        </tr>
                                    ) : (
                                        recentUsers.map((u: any, i) => (
                                            <tr key={i} className="hover:bg-white/5 transition-colors group">
                                                <td className="px-8 py-6 font-semibold text-white">{u.name}</td>
                                                <td className="px-8 py-6 text-slate-400">{u.email}</td>
                                                <td className="px-8 py-6">
                                                    {u.role === 'admin' ? (
                                                        <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-blue-500/10 text-blue-400">
                                                            Admin
                                                        </span>
                                                    ) : (
                                                        <Select
                                                            value={u.plan || 'starter'}
                                                            onValueChange={async (newPlan) => {
                                                                try {
                                                                    await apiClient.put(`/admin/users/${u.id}/plan`, { plan: newPlan });
                                                                    loadUsers(currentPage);
                                                                    loadStats();
                                                                } catch (error) {
                                                                    console.error("Erro ao alterar o plano do usuário", error);
                                                                    alert("Erro ao alterar o plano do usuário.");
                                                                }
                                                            }}
                                                        >
                                                            <SelectTrigger
                                                                className={cn(
                                                                    "h-7 text-[10px] font-extrabold uppercase tracking-widest border-none shadow-none focus:ring-0 focus:ring-offset-0 px-3",
                                                                    u.plan === "lifetime" ? "bg-violet-500/10 text-violet-400 hover:bg-violet-500/20" :
                                                                        u.plan === "premium" ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" : "bg-slate-500/10 text-slate-400 hover:bg-slate-500/20"
                                                                )}
                                                            >
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-slate-950 border-slate-800 text-slate-300">
                                                                <SelectItem value="starter" className="text-[10px] font-bold uppercase focus:bg-slate-800 focus:text-slate-300 cursor-pointer tracking-widest">Starter</SelectItem>
                                                                <SelectItem value="premium" className="text-[10px] font-bold uppercase text-emerald-400 focus:bg-emerald-500/20 focus:text-emerald-400 cursor-pointer tracking-widest">Premium</SelectItem>
                                                                <SelectItem value="lifetime" className="text-[10px] font-bold uppercase text-violet-400 focus:bg-violet-500/20 focus:text-violet-400 cursor-pointer tracking-widest">Lifetime</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    )}
                                                    {u.plan === 'premium' && u.daysLeft !== null && u.daysLeft !== undefined && (
                                                        <div className="text-[10px] text-slate-500 mt-1 font-semibold ml-2">
                                                            {u.daysLeft} dias restantes
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setUserToDelete(u);
                                                                setIsDeleteModalOpen(true);
                                                            }}
                                                            className="text-red-400 hover:text-red-300 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                        <button className="text-blue-400 hover:text-blue-300 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <ArrowUpRight size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls */}
                        <div className="p-8 border-t border-white/5 flex items-center justify-between bg-white/5">
                            <p className="text-sm text-slate-500">
                                Mostrando <span className="text-white font-medium">{recentUsers.length}</span> de <span className="text-white font-medium">{pagination.total}</span> usuários
                            </p>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1 || isLoading}
                                    className="px-5 py-2.5 rounded-xl border border-white/5 bg-slate-900/50 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900/50 transition-all font-semibold"
                                >
                                    Anterior
                                </button>
                                <div className="bg-white/5 px-4 py-2.5 rounded-xl border border-white/5 text-sm font-bold text-blue-400">
                                    {currentPage} / {pagination.totalPages}
                                </div>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                                    disabled={currentPage === pagination.totalPages || isLoading}
                                    className="px-5 py-2.5 rounded-xl border border-white/5 bg-slate-900/50 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900/50 transition-all font-semibold"
                                >
                                    Próximo
                                </button>
                            </div>
                        </div>
                    </motion.div>

                </div>
            </motion.div>

            <CreateUserModal
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
                onSuccess={() => {
                    loadUsers(currentPage);
                    loadStats();
                }}
            />

            <DeleteUserModal
                user={userToDelete}
                open={isDeleteModalOpen}
                onOpenChange={setIsDeleteModalOpen}
                onConfirm={handleDeleteUser}
            />
        </>
    );
}
