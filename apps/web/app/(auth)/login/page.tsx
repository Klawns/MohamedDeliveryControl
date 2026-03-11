"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full opacity-30">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/20 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-500/20 blur-[120px] rounded-full"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md z-10"
            >
                <div className="glass-card p-8 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl">
                    <div className="mb-8 text-center">
                        <motion.div
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            className="inline-block p-4 rounded-2xl bg-blue-500/10 mb-4"
                        >
                            <div className="w-10 h-10 flex items-center justify-center bg-blue-500 rounded-lg text-white font-bold text-xl">M</div>
                        </motion.div>
                        <h1 className="text-3xl font-bold text-white mb-2">Bem-vindo ao MDC</h1>
                        <p className="text-slate-400 text-balance">Acesse sua conta para gerenciar suas corridas com segurança</p>
                    </div>

                    <div className="space-y-4">
                        <button
                            onClick={() => {
                                const isProd = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
                                window.location.href = isProd ? "/api/auth/google" : `${API_URL}/auth/google`;
                            }}
                            className="w-full bg-white text-slate-950 hover:bg-slate-100 font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 group shadow-xl shadow-white/5"
                        >
                            <Image src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" width={22} height={22} />
                            Continuar com Google
                        </button>

                        <p className="text-[10px] text-center text-slate-500 uppercase tracking-widest font-bold pt-4">
                            ambiente 100% verificado
                        </p>
                    </div>

                    <div className="mt-12 pt-8 border-t border-white/5 flex flex-col items-center gap-4 text-sm">
                        <div className="text-slate-400">
                            Não tem uma conta?{" "}
                            <Link href="/register" className="text-blue-400 font-bold hover:text-blue-300 transition-colors">
                                Cadastre-se
                            </Link>
                        </div>

                        <Link href="/area-restrita" className="text-white/20 hover:text-white/40 text-xs transition-colors font-medium">
                            Acesso Administrativo
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
