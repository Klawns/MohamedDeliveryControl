"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Building2,
    CreditCard,
    DatabaseBackup,
    Globe,
    Settings,
    Shield,
    Ticket,
} from "lucide-react";
import { cn } from "@/lib/utils";

const sidebarNavItems = [
    {
        title: "Financeiro",
        icon: Building2,
        items: [
            {
                title: "Planos de Precos",
                href: "/admin/settings/finance/plans",
                icon: CreditCard,
            },
            {
                title: "Cupons Promocionais",
                href: "/admin/settings/finance/coupons",
                icon: Ticket,
            }
        ]
    },
    {
        title: "Sistema",
        icon: Settings,
        items: [
            {
                title: "Configuracoes Globais",
                href: "/admin/settings/system/global",
                icon: Globe,
            },
            {
                title: "Seguranca de Conta",
                href: "/admin/settings/system/security",
                icon: Shield,
            },
            {
                title: "Backups",
                href: "/admin/settings/system/backups",
                icon: DatabaseBackup,
            }
        ]
    }
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <aside className="w-full md:w-64 lg:w-72 shrink-0">
                <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-4 md:p-6 sticky top-24">
                    <nav className="flex flex-col gap-6">
                        {sidebarNavItems.map((group) => (
                            <div key={group.title} className="flex flex-col gap-2">
                                <div className="flex items-center gap-2 px-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    <group.icon size={14} />
                                    <span>{group.title}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    {group.items.map((item) => {
                                        const isActive = pathname === item.href;
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                className={cn(
                                                    "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all group relative overflow-hidden",
                                                    isActive
                                                        ? "bg-blue-600/10 text-blue-400 font-bold"
                                                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                                                )}
                                            >
                                                {isActive && (
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r-full" />
                                                )}
                                                <item.icon
                                                    size={16}
                                                    className={cn(
                                                        "transition-colors",
                                                        isActive ? "text-blue-500" : "text-slate-500 group-hover:text-slate-300"
                                                    )}
                                                />
                                                {item.title}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </nav>
                </div>
            </aside>
            <main className="flex-1 min-w-0 max-w-full lg:max-w-5xl">
                {children}
            </main>
        </div>
    );
}
