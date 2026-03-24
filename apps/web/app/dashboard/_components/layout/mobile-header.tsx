"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";

interface MobileHeaderProps {
    onOpenSidebar: () => void;
}

export function MobileHeader({ onOpenSidebar }: MobileHeaderProps) {
    return (
        <header className="lg:hidden flex items-center justify-between p-6 bg-card/40 backdrop-blur-md border-b border-border sticky top-0 z-40 shrink-0">
            <Link 
                href="/dashboard" 
                aria-label="Ir para o Dashboard"
                className="flex items-center gap-3 active:scale-95 transition-transform"
            >
                <div className="relative w-8 h-8">
                    <Image
                        src="/assets/logo8.jpg"
                        alt="Rotta Logo"
                        fill
                        className="object-cover rounded-lg"
                    />
                </div>
                <span className="font-bold tracking-tight uppercase italic text-foreground">ROTTA</span>
            </Link>
            <div className="flex items-center gap-2">
                <button 
                    onClick={onOpenSidebar} 
                    className="p-2 bg-accent/50 rounded-lg text-muted-foreground active:scale-95 transition-transform"
                >
                    <Menu size={20} />
                </button>
            </div>
        </header>
    );
}
