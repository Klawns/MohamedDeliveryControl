"use client";

import { Navbar } from "./components/navbar";
import { Hero } from "./components/hero";
import { Features } from "./components/features";
import { Pricing } from "./components/pricing";
import Image from "next/image";
import { motion } from "framer-motion";
import "./styles/deep-night.css";
import { useEffect } from "react";

export default function LandingPage() {
    useEffect(() => {
        // Implement smooth scroll to anchors
        const handleAnchorClick = (e: Event) => {
            const anchor = e.currentTarget as HTMLAnchorElement;
            const targetId = anchor.getAttribute('href');

            if (targetId && targetId.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(targetId);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            }
        };

        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', handleAnchorClick);
        });

        return () => {
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.removeEventListener('click', handleAnchorClick);
            });
        };
    }, []);

    return (
        <main className="deep-night-bg selection:bg-blue-500/30 selection:text-white relative overflow-hidden">
            {/* Background Decorations */}
            <div className="fixed inset-0 pointer-events-none z-0">
                {/* Subtle Grid Pattern */}
                <div className="absolute inset-0 opacity-[0.03]"
                    style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }}
                />

                {/* Vertical frame lines for luxury feel */}
                <div className="absolute left-[5%] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/[0.03] to-transparent hidden xl:block" />
                <div className="absolute right-[5%] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/[0.03] to-transparent hidden xl:block" />

                {/* Floating Abstract Shapes */}
                <motion.div
                    animate={{ rotate: 360, y: [0, 50, 0] }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute top-1/4 -left-20 w-80 h-80 border border-blue-500/10 rounded-[4rem] hidden lg:block"
                />
                <motion.div
                    animate={{ rotate: -360, x: [0, 100, 0] }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-1/4 -right-20 w-96 h-96 border border-violet-500/10 rounded-full hidden lg:block"
                />

                {/* Extra Minimalist Accents (dots) */}
                <div className="absolute top-[15%] left-[8%] flex flex-col gap-1">
                    <div className="w-1 h-1 rounded-full bg-white/20" />
                    <div className="w-1 h-1 rounded-full bg-white/10" />
                    <div className="w-1 h-1 rounded-full bg-white/5" />
                </div>

                <div className="absolute bottom-[15%] right-[8%] flex flex-col gap-1">
                    <div className="w-1 h-1 rounded-full bg-white/5" />
                    <div className="w-1 h-1 rounded-full bg-white/10" />
                    <div className="w-1 h-1 rounded-full bg-white/20" />
                </div>

                {/* Extra Glows */}
                <div className="absolute top-[10%] right-[10%] w-[400px] h-[400px] bg-blue-600/5 blur-[100px] rounded-full" />
                <div className="absolute bottom-[20%] left-[10%] w-[500px] h-[500px] bg-indigo-600/5 blur-[120px] rounded-full" />
            </div>

            <div className="relative z-10">
                <Navbar />
                <Hero />
                <Features />
                <Pricing />

                <footer className="py-20 px-6 border-t border-white/5 bg-[#020617] relative overflow-hidden">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 blur-[100px] rounded-full" />

                    {/* Footer decoration */}
                    <div className="absolute right-0 bottom-0 w-64 h-64 border-t border-l border-white/5 rounded-tl-[100px] opacity-20" />

                    <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-12 relative z-10">
                        <div className="flex flex-col items-center md:items-start gap-6">
                            <div className="flex items-center gap-3">
                                <div className="relative h-10 w-10">
                                    <Image
                                        src="/assets/logo3.webp"
                                        alt="Rotta Logo"
                                        fill
                                        className="object-contain rounded-lg"
                                    />
                                </div>
                                <span className="text-2xl font-black text-white tracking-tighter uppercase italic">ROTTA</span>
                            </div>
                            <p className="text-slate-500 text-sm text-center md:text-left leading-relaxed font-medium">
                                © 2026 Rotta Delivery Control.<br />A elite do gerenciamento para entregadores profissionais.
                            </p>
                        </div>

                        <div className="flex flex-wrap justify-center gap-10 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                            <a href="#" className="hover:text-blue-400 transition-colors">Privacidade</a>
                            <a href="#" className="hover:text-blue-400 transition-colors">Termos</a>
                            <a href="#" className="hover:text-blue-400 transition-colors">Suporte</a>
                        </div>
                    </div>
                </footer>
            </div>
        </main>
    );
}
