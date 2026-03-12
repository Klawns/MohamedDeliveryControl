"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navLinks = [
        { label: "Recursos", href: "#features" },
        { label: "Preços", href: "#pricing" },
    ];

    return (
        <nav className={cn(
            "fixed top-0 left-0 right-0 z-[100] transition-all duration-500 px-6",
            scrolled ? "py-4 bg-slate-950/80 backdrop-blur-xl border-b border-white/5" : "py-8 bg-transparent"
        )}>
            <div className="container mx-auto flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="relative h-12 w-12 group-hover:scale-105 transition-transform duration-300">
                        <Image
                            src="/assets/logo3.webp"
                            alt="Rotta Logo"
                            fill
                            className="object-contain rounded-xl"
                            priority
                        />
                    </div>
                    <span className="text-2xl font-black text-white tracking-tighter uppercase italic">ROTTA</span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-10">
                    <div className="flex items-center gap-8">
                        {navLinks.map(link => (
                            <Link
                                key={link.label}
                                href={link.href}
                                className="text-sm font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-widest relative group/link"
                            >
                                {link.label}
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all group-hover/link:w-full" />
                            </Link>
                        ))}
                    </div>
                    <div className="h-6 w-px bg-white/10 mx-2" />
                    <div className="flex items-center gap-4">
                        <Link
                            href="/login"
                            className="text-sm font-bold text-white hover:text-blue-400 transition-colors uppercase tracking-widest px-4"
                        >
                            Entrar
                        </Link>
                        <Link
                            href="/register"
                            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95 text-sm uppercase tracking-widest"
                        >
                            Começar
                        </Link>
                    </div>
                </div>

                {/* Mobile Toggle */}
                <button
                    className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden overflow-hidden bg-slate-900/95 backdrop-blur-2xl border-t border-white/5 absolute top-full left-0 right-0 px-6 py-8"
                    >
                        <div className="flex flex-col gap-6">
                            {navLinks.map(link => (
                                <Link
                                    key={link.label}
                                    href={link.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="text-lg font-bold text-slate-300 hover:text-blue-400 transition-colors"
                                >
                                    {link.label}
                                </Link>
                            ))}
                            <div className="h-px w-full bg-white/5" />
                            <Link
                                href="/login"
                                className="text-lg font-bold text-white py-2"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Entrar
                            </Link>
                            <Link
                                href="/register"
                                className="bg-blue-600 text-white px-6 py-4 rounded-2xl font-bold text-center shadow-lg shadow-blue-600/20"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Começar Agora
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
