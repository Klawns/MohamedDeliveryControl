"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Menu, LogOut, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { User } from "@/hooks/use-auth";
import { MenuItem } from "../../_hooks/use-sidebar-state";

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    user: User | null;
    menuItems: MenuItem[];
    logout: () => void;
}

export function Sidebar({ isOpen, setIsOpen, user, menuItems, logout }: SidebarProps) {
    const pathname = usePathname();

    const handleMenuClick = () => {
        if (window.innerWidth < 1024) {
            setIsOpen(false);
        }
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-overlay-background/60 backdrop-blur-sm z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            <aside
                className={cn(
                    "fixed lg:relative inset-y-0 left-0 z-50 bg-sidebar-background backdrop-blur-xl border-r border-sidebar-border transition-all duration-500 ease-in-out overflow-hidden flex flex-col",
                    isOpen ? "w-72 translate-x-0" : "w-0 lg:w-24 -translate-x-full lg:translate-x-0"
                )}
            >
                <div className="flex flex-col h-full p-6 min-w-[18rem] lg:min-w-0">
                    <div className="flex items-center justify-between mb-10 overflow-hidden h-12">
                        <AnimatePresence mode="wait">
                            {isOpen && (
                                <Link 
                                    href="/dashboard"
                                    aria-label="Ir para o Dashboard"
                                    className="flex items-center gap-3 shrink-0 active:scale-95 transition-transform"
                                >
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="flex items-center gap-3"
                                    >
                                        <div className="relative w-10 h-10 shrink-0">
                                            <Image
                                                src="/assets/logo8.jpg"
                                                alt="Rotta Logo"
                                                fill
                                                className="object-cover rounded-lg"
                                            />
                                        </div>
                                        <span className="font-display font-extrabold text-xl tracking-tighter uppercase whitespace-nowrap italic text-text-primary">Rotta App</span>
                                    </motion.div>
                                </Link>
                            )}
                        </AnimatePresence>
                        <div className="flex items-center gap-2">
                            {/* Desktop Toggle */}
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className={cn(
                                    "hidden lg:flex p-2 hover:bg-sidebar-accent rounded-xl transition-all text-sidebar-foreground-muted hover:text-sidebar-foreground bg-sidebar-accent/50 active:scale-90 border border-transparent hover:border-sidebar-border",
                                    !isOpen && "flex"
                                )}
                                aria-label={isOpen ? "Recolher Sidebar" : "Expandir Sidebar"}
                            >
                                {isOpen ? <X size={20} /> : <Menu size={20} />}
                            </button>

                            {/* Mobile Close Button - Only visible on mobile when open */}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="lg:hidden p-2.5 bg-icon-destructive/10 text-icon-destructive hover:bg-icon-destructive hover:text-white rounded-xl transition-all active:scale-95 border border-icon-destructive/10"
                                aria-label="Fechar Menu"
                            >
                                <X size={22} />
                            </button>
                        </div>
                    </div>

                    <nav className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
                        {menuItems.map((item) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                onClick={handleMenuClick}
                                className={cn(
                                    "flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-sidebar-accent/50 transition-all group active:scale-95 border border-transparent",
                                    pathname === item.href && "bg-sidebar-accent-active text-sidebar-foreground-primary shadow-sm border-sidebar-border-active",
                                    !isOpen && "lg:justify-center lg:px-0"
                                )}
                                title={!isOpen ? item.label : ""}
                            >
                                <item.icon 
                                    size={22} 
                                    className={cn(
                                        "shrink-0 transition-all duration-300",
                                        item.color,
                                        pathname === item.href 
                                            ? "brightness-110 saturate-125 scale-110" 
                                            : "opacity-60 group-hover:opacity-100 group-hover:scale-105 saturate-[0.8]"
                                    )} 
                                />
                                {isOpen && (
                                    <span className={cn(
                                        "font-medium transition-colors",
                                        pathname === item.href ? "text-sidebar-foreground-primary" : "text-sidebar-foreground-muted group-hover:text-sidebar-foreground"
                                    )}>
                                        {item.label}
                                    </span>
                                )}
                            </Link>
                        ))}

                        {user?.subscription?.plan === 'starter' && user?.subscription?.status === 'active' && isOpen && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <Link
                                    href="/pricing"
                                    onClick={handleMenuClick}
                                    className="mx-4 mt-6 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-button-primary text-button-primary-foreground font-black text-xs uppercase tracking-widest hover:bg-button-primary-hover transition-all shadow-lg shadow-button-shadow active:scale-95 group"
                                >
                                    <Sparkles size={14} className="group-hover:rotate-12 transition-transform" />
                                    Fazer Upgrade
                                </Link>
                            </motion.div>
                        )}
                    </nav>

                    <div className="pt-6 border-t border-sidebar-border mt-auto">
                        <div className={cn("flex items-center gap-3 px-4 py-3 mb-4", !isOpen && "lg:justify-center lg:px-0")}>
                            <div className="w-10 h-10 rounded-full bg-icon-brand/10 text-icon-brand flex items-center justify-center font-bold text-sm shrink-0 border border-icon-brand/20 transition-colors">
                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            {isOpen && (
                                <div className="overflow-hidden">
                                    <p className="font-semibold truncate text-text-primary">{user?.name}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <p className="text-[10px] text-sidebar-foreground-muted truncate leading-none font-medium">{user?.email}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={logout}
                            className={cn(
                                "w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-icon-destructive/10 text-sidebar-foreground-muted hover:text-icon-destructive transition-all group active:scale-95",
                                !isOpen && "lg:justify-center lg:px-0"
                            )}
                            title={!isOpen ? "Sair" : ""}
                        >
                            <LogOut size={20} className="shrink-0 group-hover:-translate-x-1 transition-transform" />
                            {isOpen && <span className="font-medium">Sair</span>}
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
