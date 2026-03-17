"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Bike, Users, Wallet, ChevronRight, Calendar, ChevronLeft, Pencil, Trash2 } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/services/api";
import Link from "next/link";
import { RideModal } from "@/components/ride-modal";
import { ConfirmModal } from "@/components/confirm-modal";
import { MobileDashboard } from "@/components/dashboard/mobile-dashboard";
import { RidesChart } from "@/components/dashboard/rides-chart";

export default function DashboardPage() {
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [period, setPeriod] = useState<'today' | 'week'>('today');
    const [stats, setStats] = useState({ count: 0, totalValue: 0, rides: [] });
    const [monthRides, setMonthRides] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [activitiesPage, setActivitiesPage] = useState(1);
    const [isRideModalOpen, setIsRideModalOpen] = useState(false);
    const [rideToEdit, setRideToEdit] = useState<any>(null);
    const [rideToDelete, setRideToDelete] = useState<any>(null);
    const [isDeletingRide, setIsDeletingRide] = useState(false);
    const itemsPerPage = 4;

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (user?.role === 'admin') {
            router.push('/admin');
        }
    }, [user, router]);

    useEffect(() => {
        if (searchParams.get('payment') === 'success') {
            const hasShownToast = localStorage.getItem('payment_success_shown');
            if (!hasShownToast) {
                toast({
                    title: "Pagamento Confirmado! 🎉",
                    description: "Seu plano foi atualizado com sucesso. Aproveite todos os recursos!",
                });
                localStorage.setItem('payment_success_shown', 'true');
            }
            window.history.replaceState({}, '', '/dashboard');
        } else {
            // Limpa a flag se não estiver em contexto de pagamento
            localStorage.removeItem('payment_success_shown');
        }
    }, [searchParams, toast]);

    useEffect(() => {
        if (user) {
            fetchStats();
        }
    }, [period, user]);

    const fetchStats = async () => {
        try {
            const [statsRes, monthRes] = await Promise.all([
                api.get(`/rides/stats?period=${period}`),
                api.get('/rides/stats?period=month')
            ]);
            setStats(statsRes.data);
            setMonthRides(monthRes.data.rides || []);
        } catch (err) {
            console.error("Erro ao buscar stats", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditRide = (ride: any) => {
        setRideToEdit(ride);
        setIsRideModalOpen(true);
    };

    const handleDeleteRide = async () => {
        if (!rideToDelete) return;
        setIsDeletingRide(true);
        try {
            await api.delete(`/rides/${rideToDelete.id}`);
            toast({ title: "Corrida excluída" });
            fetchStats();
            setRideToDelete(null);
        } catch (err) {
            toast({ title: "Erro ao excluir", variant: "destructive" });
        } finally {
            setIsDeletingRide(false);
        }
    };

    const dashboardStats = [
        {
            label: `Corridas ${period === 'today' ? 'Hoje' : 'na Semana'}`,
            value: String(stats.count),
            icon: Bike,
            bg: period === 'today' ? "bg-blue-600/20" : "bg-orange-500/30",
            text: period === 'today' ? "text-blue-400" : "text-orange-400"
        },
        {
            label: "Faturamento",
            value: formatCurrency(stats.totalValue),
            icon: Wallet,
            bg: "bg-violet-600/20",
            text: "text-violet-400"
        },
    ];

    if (isMobile) {
        return (
            <div className="space-y-6">
                <header>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Painel Rápido</h1>
                    <p className="text-slate-400 text-sm">Olá, {user?.name?.split(" ")[0]}! Registre suas corridas aqui.</p>
                </header>

                <div className="grid grid-cols-2 gap-4">
                    {dashboardStats.map((stat) => (
                        <div key={stat.label} className="bg-slate-900/40 border border-white/5 p-4 rounded-2xl">
                            <p className="text-slate-400 text-[10px] font-bold uppercase">{stat.label}</p>
                            <h3 className="text-lg font-bold text-white mt-1">{stat.value}</h3>
                        </div>
                    ))}
                </div>

                <MobileDashboard onRideCreated={fetchStats} />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Olá, {user?.name?.split(" ")[0] || "Usuário"}!</h1>
                    <p className="text-slate-400 mt-1">Aqui está o resumo das suas atividades.</p>
                </div>
                <div className="flex items-center gap-3 bg-slate-900/50 p-1 rounded-xl border border-white/5 self-start md:self-center">
                    <button
                        onClick={() => setPeriod('today')}
                        className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all", period === 'today' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-400 hover:text-white")}
                    >
                        Hoje
                    </button>
                    <button
                        onClick={() => setPeriod('week')}
                        className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all", period === 'week' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-400 hover:text-white")}
                    >
                        Semana
                    </button>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {isLoading ? (
                    [1, 2].map(i => <div key={i} className="h-40 bg-white/5 animate-pulse rounded-3xl" />)
                ) : (
                    dashboardStats.map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="glass-card p-6 rounded-3xl border border-white/5 bg-slate-900/40 relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-white/10 transition-colors"></div>
                            <div className="flex items-start justify-between relative z-10">
                                <div className={cn("p-4 rounded-2xl", stat.bg)}>
                                    <stat.icon size={24} className={stat.text} />
                                </div>
                            </div>
                            <div className="mt-6 relative z-10">
                                <p className="text-slate-400 text-sm font-medium">{stat.label}</p>
                                <h3 className="text-3xl font-bold text-white mt-1">{stat.value}</h3>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Main Sections */}
            {/* Main Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                {/* 1. Recent Activities */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass-card p-8 rounded-3xl border border-white/5 bg-slate-900/40 h-full flex flex-col"
                >
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold text-white">Atividades Recentes</h2>
                        <Link href="/dashboard/rides" className="text-sm text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1">
                            Ver histórico <ChevronRight size={16} />
                        </Link>
                    </div>

                    <div className="space-y-6 flex-1 flex flex-col">
                        {isLoading ? (
                            [1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-white/5 animate-pulse rounded-2xl" />)
                        ) : stats.rides.length === 0 ? (
                            <p className="text-slate-500 text-center py-10 text-sm italic">Nenhuma atividade registrada no período.</p>
                        ) : (
                            <>
                                <div className="space-y-6">
                                    {stats.rides
                                        .slice((activitiesPage - 1) * itemsPerPage, activitiesPage * itemsPerPage)
                                        .map((ride: any) => (
                                            <div
                                                key={ride.id}
                                                className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 group"
                                            >
                                                <div className={cn("p-3 rounded-xl", period === 'today' ? "bg-blue-500/10 text-blue-400" : "bg-orange-500/10 text-orange-400")}>
                                                    <Calendar size={20} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-white truncate">ID: {ride.id?.split("-")[0] || "---"}</h4>
                                                    <p className="text-xs text-slate-500 mt-0.5">{new Date(ride.rideDate || ride.createdAt).toLocaleString()}</p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <p className="font-bold text-white">{formatCurrency(ride.value)}</p>
                                                        <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full text-center block w-fit ml-auto">OK</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleEditRide(ride)}
                                                            className="p-3 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white rounded-xl transition-all active:scale-90"
                                                            title="Editar"
                                                        >
                                                            <Pencil size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => setRideToDelete(ride)}
                                                            className="p-3 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-xl transition-all active:scale-90"
                                                            title="Excluir"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                </div>

                                {stats.rides.length > itemsPerPage && (
                                    <div className="flex items-center justify-center gap-4 pt-4 mt-auto border-t border-white/5">
                                        <button
                                            disabled={activitiesPage === 1}
                                            onClick={() => setActivitiesPage(p => p - 1)}
                                            className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                        >
                                            <ChevronLeft size={18} />
                                        </button>
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                            Página {activitiesPage} de {Math.ceil(stats.rides.length / itemsPerPage)}
                                        </span>
                                        <button
                                            disabled={activitiesPage * itemsPerPage >= stats.rides.length}
                                            onClick={() => setActivitiesPage(p => p + 1)}
                                            className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                        >
                                            <ChevronRight size={18} />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </motion.div>

                {/* 2. Chart */}
                <RidesChart rides={monthRides} className="h-full" />

                {/* 3. Quick Access */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card p-8 rounded-[2.5rem] border border-white/5 bg-slate-900/40 h-full"
                >
                    <h2 className="text-xl font-bold text-white mb-6">Acesso Rápido</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <Link href="/dashboard/clients" className="p-6 rounded-[2rem] bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-left group">
                            <Users className="text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                            <span className="block font-semibold">Novo Cliente</span>
                        </Link>
                        <Link href="/dashboard/rides" className="p-6 rounded-[2rem] bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-left group">
                            <Bike className="text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                            <span className="block font-semibold">Registrar Corrida</span>
                        </Link>
                    </div>
                </motion.div>

                {/* 4. Financial Reports */}
                <Link href="/dashboard/finance" className="block outline-none h-full">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="glass-card p-8 rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-blue-600/20 to-violet-600/20 relative overflow-hidden group hover:from-blue-600/30 transition-all cursor-pointer h-full"
                    >
                        <div className="relative z-10">
                            <h2 className="text-2xl font-bold text-white">Relatórios Financeiros</h2>
                            <p className="text-slate-300 mt-2 max-w-[80%]">Analise suas métricas detalhadas e exporte relatórios em PDF.</p>
                            <div className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 font-bold rounded-xl group-hover:scale-105 transition-all">
                                Acessar agora
                            </div>
                        </div>
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/20 blur-[60px] rounded-full"></div>
                    </motion.div>
                </Link>
            </div>
            <RideModal
                isOpen={isRideModalOpen}
                onClose={() => {
                    setIsRideModalOpen(false);
                    setRideToEdit(null);
                }}
                onSuccess={fetchStats}
                rideToEdit={rideToEdit}
            />

            <ConfirmModal
                isOpen={!!rideToDelete}
                onClose={() => setRideToDelete(null)}
                onConfirm={handleDeleteRide}
                title="Excluir Corrida"
                description="Deseja realmente excluir esta corrida?"
                confirmText="Excluir"
                variant="danger"
                isLoading={isDeletingRide}
            />
        </div>
    );
}
