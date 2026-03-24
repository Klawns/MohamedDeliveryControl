"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { api, apiClient } from "@/services/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function LoginPage() {
    const { login } = useAuth();
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
                            className="inline-block p-1 rounded-2xl bg-blue-500/10 mb-4"
                        >
                            <div className="relative w-16 h-16 overflow-hidden rounded-xl shadow-lg shadow-blue-500/20">
                                <Image
                                    src="/assets/logo8.jpg"
                                    alt="Rotta Logo"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        </motion.div>
                        <h1 className="text-3xl font-bold text-white mb-2">Bem-vindo ao Rotta</h1>
                        <p className="text-slate-400 text-balance">Acesse sua conta para gerenciar suas corridas com segurança</p>
                    </div>

                    <div className="space-y-4">
                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                const email = formData.get("email") as string;
                                const password = formData.get("password") as string;

                                try {
                                    const data = await apiClient.post<any>("/auth/login", { email, password });
                                    login(data.user);
                                } catch (error: any) {
                                    alert(error.response?.data?.message || "Erro ao fazer login");
                                }
                            }}
                            className="space-y-4"
                        >
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300 ml-1">E-mail</label>
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    placeholder="seu@email.com"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300 ml-1">Senha</label>
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    placeholder="••••••"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]"
                            >
                                Entrar
                            </button>
                        </form>

                        <div className="relative py-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/5"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-slate-950 px-2 text-slate-500">Ou continue com</span>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                // Usamos o prefixo /api que é roteado via rewrite do Next.js (next.config.mjs)
                                // para o backend, garantindo consistência entre dev e prod e evitando 
                                // problemas de conexão direta com o porto do backend em dev.
                                window.location.href = "/api/auth/google";
                            }}
                            className="w-full bg-white text-slate-950 hover:bg-slate-100 font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 group shadow-xl shadow-white/5"
                        >
                            <Image src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" width={22} height={22} />
                            Google
                        </button>

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
