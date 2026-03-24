"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function SecuritySettingsPage() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10 fade-in"
        >
            <div className="max-w-2xl">
                <div className="glass-card p-8 rounded-[2rem] border border-white/5 bg-gradient-to-br from-emerald-500/5 to-blue-500/5 relative overflow-hidden">
                    <h2 className="text-2xl font-bold text-white mb-2">Segurança de Conta</h2>
                    <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                        Mantenha suas credenciais administrativas seguras, isso não altera o acesso via Provedores (Google).
                    </p>
                    <PasswordChangeForm />
                </div>
            </div>
        </motion.div>
    );
}

function PasswordChangeForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        try {
            const { apiClient } = await import("@/services/api");
            await apiClient.patch("/auth/change-password", data);
            setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
            (e.target as HTMLFormElement).reset();
        } catch (err: any) {
            setMessage({
                type: 'error',
                text: err.response?.data?.message || 'Erro ao alterar senha. Verifique os dados.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Senha Atual</label>
                <input
                    name="currentPassword"
                    type="password"
                    required
                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500/50 transition-all font-mono"
                    placeholder="••••••••"
                />
            </div>
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Nova Senha</label>
                <input
                    name="newPassword"
                    type="password"
                    required
                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500/50 transition-all font-mono"
                    placeholder="••••••••"
                />
            </div>
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Confirmar Nova Senha</label>
                <input
                    name="confirmPassword"
                    type="password"
                    required
                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500/50 transition-all font-mono"
                    placeholder="••••••••"
                />
            </div>

            {message && (
                <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                        "text-sm font-medium p-4 rounded-xl mt-4 border",
                        message.type === 'success' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                    )}
                >
                    {message.text}
                </motion.p>
            )}

            <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
            >
                {isLoading ? "Autenticando..." : "Atualizar Credenciais"}
            </button>
        </form>
    );
}
