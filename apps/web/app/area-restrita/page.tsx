"use client";

import { motion } from "framer-motion";
import { ArrowRight, Mail, Lock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { api, apiClient } from "@/services/api";

export default function AreaRestritaPage() {
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        try {
            const data = await apiClient.post<any>("/auth/login", { email, password });
            const { user } = data;
            login(user, "/admin");
        } catch (err: any) {
            setError(err.response?.data?.message || "Erro no acesso administrativo.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full opacity-30">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-red-500/10 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-slate-500/10 blur-[120px] rounded-full"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md z-10"
            >
                <div className="glass-card p-8 rounded-3xl border border-red-500/10 shadow-2xl backdrop-blur-xl bg-slate-900/40">
                    <div className="mb-8 text-center">
                        <motion.div
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            className="inline-block p-4 rounded-2xl bg-red-500/10 mb-4"
                        >
                            <Lock className="w-10 h-10 text-red-500" />
                        </motion.div>
                        <h1 className="text-3xl font-black text-white mb-2 tracking-tight uppercase italic">Rotta Admin</h1>
                        <p className="text-slate-400 text-sm">Acesso exclusivo para administradores</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium text-center">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">E-mail Admin</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-red-400 transition-colors text-slate-600">
                                    <Mail size={18} />
                                </div>
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    className="w-full bg-slate-950/50 border border-white/5 rounded-xl py-4 pl-11 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/30 transition-all font-medium"
                                    placeholder="admin@mdc.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Chave de Acesso</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-red-400 transition-colors text-slate-600">
                                    <Lock size={18} />
                                </div>
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    className="w-full bg-slate-950/50 border border-white/5 rounded-xl py-4 pl-11 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/30 transition-all font-medium"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 group shadow-xl shadow-red-600/20"
                        >
                            {isLoading ? (
                                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    Autenticar Sistema
                                    <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <Link href="/login" className="text-slate-500 hover:text-slate-300 text-xs transition-colors">
                            Voltar para o Login Público
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
