"use client";

import { useAuth } from "@/hooks/use-auth";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, Users, Bike, LogOut, ChevronRight, Menu, X, Wallet, Shield, Settings, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { TutorialModal } from "@/components/dashboard/tutorial-modal";
import { api } from "@/services/api";
import { motion, AnimatePresence } from "framer-motion";
import { StarterLimitPopup } from "@/components/dashboard/starter-limit-popup";
import { SubscriptionExpiringPopup } from "@/components/dashboard/subscription-expiring-popup";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, logout, isLoading, isAuthenticated, updateUser } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isTutorialOpen, setIsTutorialOpen] = useState(false);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/login");
            return;
        }

        if (!isLoading && isAuthenticated && user?.role === 'admin') {
            router.push("/admin");
            return;
        }

        if (!isLoading && isAuthenticated && user?.role === 'user') {
            const isStarter = user?.subscription?.plan === 'starter';
            const hasPaidPlan = user?.subscription?.plan === 'premium' || user?.subscription?.plan === 'lifetime';
            const isActive = user?.subscription?.status === 'active' || user?.subscription?.status === 'trial';
            const rideCount = user?.subscription?.rideCount || 0;

            const reachedLimit = isStarter && rideCount >= 20;
            const shouldBlock = reachedLimit || (!hasPaidPlan && !isStarter) || !isActive;

            if (shouldBlock && pathname.startsWith('/dashboard') && pathname !== '/dashboard/payment-success') {
                router.push("/pricing?reason=limit_reached");
            }
        }
    }, [isLoading, isAuthenticated, user, router, pathname]);

    useEffect(() => {
        if (!isLoading && user && !user.hasSeenTutorial && user.role === 'user') {
            const hasActivePlan = user.subscription?.status === 'active' || user.subscription?.status === 'trial';
            if (hasActivePlan) {
                setIsTutorialOpen(true);
            }
        }
    }, [isLoading, user]);

    async function handleCloseTutorial() {
        setIsTutorialOpen(false);
        try {
            await api.patch("/settings/tutorial-seen");
            updateUser({ ...user, hasSeenTutorial: true } as any);
        } catch (err) {
            console.error("Erro ao marcar tutorial como visto", err);
        }
    }

    const handleMenuClick = () => {
        if (window.innerWidth < 1024) {
            setIsSidebarOpen(false);
        }
    };

    if (isLoading || !isAuthenticated) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="h-10 w-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    const menuItems = [
        { icon: LayoutDashboard, label: "Visão Geral", color: "text-blue-400", href: "/dashboard", roles: ["user"] },
        { icon: Users, label: "Clientes", color: "text-emerald-400", href: "/dashboard/clients", roles: ["user"] },
        { icon: Bike, label: "Corridas", color: "text-violet-400", href: "/dashboard/rides", roles: ["user"] },
        { icon: Wallet, label: "Financeiro", color: "text-amber-400", href: "/dashboard/finance", roles: ["user"] },
        { icon: Settings, label: "Configurações", color: "text-slate-400", href: "/dashboard/settings", roles: ["user"] },
        { icon: Sparkles, label: "Tutorial", color: "text-violet-400", href: "/dashboard/tutorial", roles: ["user"] },
        { icon: Shield, label: "Administração", color: "text-red-400", href: "/admin", roles: ["admin"] },
    ].filter(item => {
        const hasRole = item.roles.includes(user?.role || "user");
        if (user?.role === 'user' && user.subscription?.status === 'expired' && item.href !== '/dashboard' && item.href !== '/dashboard/settings') {
            return false;
        }
        return hasRole;
    });

    const isExpired = user?.role === 'user' && user.subscription?.status === 'expired';
    const validUntil = user?.subscription?.validUntil ? new Date(user.subscription.validUntil) : null;
    const now = new Date();
    const diffTime = validUntil ? validUntil.getTime() - now.getTime() : 0;
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const showExpiringPopup = user?.role === 'user' && !isExpired && user?.subscription?.plan !== 'starter' && daysRemaining > 0 && daysRemaining <= 3;
    const isExpiringSoon = user?.role === 'user' && !isExpired && user.subscription?.validUntil && (diffTime < 5 * 24 * 60 * 60 * 1000);

    return (
        <div className="min-h-screen bg-[#020617] text-slate-50 flex overflow-hidden">
            <TutorialModal isOpen={isTutorialOpen} onClose={handleCloseTutorial} />

            {user?.subscription?.plan === 'starter' && user?.subscription?.status === 'active' && (
                <StarterLimitPopup rideCount={user.subscription.rideCount || 0} />
            )}

            {showExpiringPopup && (
                <SubscriptionExpiringPopup daysRemaining={daysRemaining} />
            )}

            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            <aside
                className={cn(
                    "fixed lg:relative inset-y-0 left-0 z-50 bg-slate-900/40 backdrop-blur-xl border-r border-white/5 transition-all duration-500 ease-in-out overflow-hidden flex flex-col",
                    isSidebarOpen ? "w-72 translate-x-0" : "w-0 lg:w-24 -translate-x-full lg:translate-x-0"
                )}
            >
                <div className="flex flex-col h-full p-6 min-w-[18rem] lg:min-w-0">
                    <div className="flex items-center justify-between mb-10 overflow-hidden h-12">
                        <AnimatePresence mode="wait">
                            {isSidebarOpen && (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="flex items-center gap-3 shrink-0"
                                >
                                    <div className="relative w-10 h-10 shrink-0">
                                        <Image
                                            src="/assets/logo3.webp"
                                            alt="Rotta Logo"
                                            fill
                                            className="object-contain rounded-lg"
                                        />
                                    </div>
                                    <span className="font-black text-xl tracking-tighter uppercase whitespace-nowrap italic">Rotta App</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className={cn(
                                "p-2 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white bg-white/5 active:scale-90",
                                !isSidebarOpen && "hidden lg:flex"
                            )}
                        >
                            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>

                    <nav className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
                        {menuItems.map((item) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                onClick={handleMenuClick}
                                className={cn(
                                    "flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/5 transition-all group active:scale-95",
                                    pathname === item.href && "bg-white/5 text-white shadow-inner",
                                    !isSidebarOpen && "lg:justify-center lg:px-0"
                                )}
                                title={!isSidebarOpen ? item.label : ""}
                            >
                                <item.icon size={22} className={cn(item.color, "shrink-0")} />
                                {isSidebarOpen && (
                                    <span className="font-medium text-slate-300 group-hover:text-white transition-colors">{item.label}</span>
                                )}
                            </Link>
                        ))}

                        {user?.subscription?.plan === 'starter' && user?.subscription?.status === 'active' && isSidebarOpen && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <Link
                                    href="/pricing"
                                    onClick={handleMenuClick}
                                    className="mx-4 mt-6 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-blue-600 text-white font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 active:scale-95 group"
                                >
                                    <Sparkles size={14} className="group-hover:rotate-12 transition-transform" />
                                    Fazer Upgrade
                                </Link>
                            </motion.div>
                        )}
                    </nav>

                    <div className="pt-6 border-t border-white/5 mt-auto">
                        <div className={cn("flex items-center gap-3 px-4 py-3 mb-4", !isSidebarOpen && "lg:justify-center lg:px-0")}>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-violet-500 flex items-center justify-center font-bold text-sm shrink-0">
                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            {isSidebarOpen && (
                                <div className="overflow-hidden">
                                    <p className="font-semibold truncate">{user?.name}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <p className="text-[10px] text-slate-500 truncate leading-none">{user?.email}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={logout}
                            className={cn(
                                "w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all group",
                                !isSidebarOpen && "lg:justify-center lg:px-0"
                            )}
                            title={!isSidebarOpen ? "Sair" : ""}
                        >
                            <LogOut size={20} className="shrink-0" />
                            {isSidebarOpen && <span className="font-medium">Sair</span>}
                        </button>
                    </div>
                </div>
            </aside>

            <main className="flex-1 relative overflow-y-auto flex flex-col min-w-0">
                {!isSidebarOpen && (
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="fixed bottom-8 left-8 z-[70] hidden lg:flex h-14 w-14 bg-blue-600 rounded-2xl items-center justify-center text-white shadow-2xl shadow-blue-500/40 hover:scale-110 active:scale-95 transition-all"
                    >
                        <Menu size={24} />
                    </button>
                )}

                {isExpired && (
                    <div className="bg-red-600 text-white px-6 py-2 text-center text-sm font-bold flex items-center justify-center gap-4 sticky top-0 z-[60]">
                        <span>Sua assinatura expirou!</span>
                        <Link href="/dashboard/checkout?plan=premium" className="bg-white text-red-600 px-3 py-1 rounded-lg hover:bg-slate-100 transition-colors shrink-0">
                            Renovar Agora
                        </Link>
                    </div>
                )}

                {isExpiringSoon && (
                    <div className="bg-amber-500 text-slate-900 px-6 py-2 text-center text-sm font-bold flex items-center justify-center gap-4 sticky top-0 z-[60]">
                        <span>Sua assinatura vence em breve.</span>
                        <Link href="/dashboard/checkout?plan=premium" className="bg-slate-900 text-white px-3 py-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0">
                            Pagar R$ 5,00
                        </Link>
                    </div>
                )}

                <header className="lg:hidden flex items-center justify-between p-6 bg-slate-900/40 backdrop-blur-md border-b border-white/5 sticky top-0 z-40 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="relative w-8 h-8 font-black">
                            <Image
                                src="/assets/logo3.webp"
                                alt="Rotta Logo"
                                fill
                                className="object-contain rounded-lg"
                            />
                        </div>
                        <span className="font-bold tracking-tight uppercase italic text-white">ROTTA</span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-white/5 rounded-lg text-slate-300">
                        <Menu size={20} />
                    </button>
                </header>

                <div className="p-6 lg:p-10 max-w-7xl w-full mx-auto flex-1">
                    {children}
                </div>
            </main>
        </div>
    );
}
