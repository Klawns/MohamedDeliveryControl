"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Rocket } from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/use-auth";

export default function PaymentSuccessPage() {
    const router = useRouter();
    const { updateUser } = useAuth();
    const [status, setStatus] = useState<'verifying' | 'success' | 'delay'>('verifying');

    useEffect(() => {
        let attempts = 0;
        const maxAttempts = 60; // 60 tentativas * 2s = 120s (2 min)

        const checkPayment = async () => {
            try {
                // Força busca do perfil atualizado
                const response = await api.get("/auth/me");
                const user = response.data;

                // Se o plano já mudou de starter (ou status está ativo)
                if (user.subscription?.plan !== 'starter' && user.subscription?.status === 'active') {
                    updateUser(user);
                    setStatus('success');
                    setTimeout(() => router.push("/dashboard"), 3000);
                } else {
                    attempts++;
                    if (attempts < maxAttempts) {
                        setTimeout(checkPayment, 2000); // Tenta de novo em 2s
                    } else {
                        setStatus('delay');
                    }
                }
            } catch (err) {
                console.error("Erro ao verificar pagamento:", err);
                setStatus('delay');
            }
        };

        checkPayment();
    }, [router, updateUser]);

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
            <div className="max-w-md w-full space-y-8">
                {status === 'verifying' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-6"
                    >
                        <Loader2 className="w-16 h-16 text-lime-400 animate-spin mx-auto" />
                        <h1 className="text-2xl font-bold text-white">Confirmando seu pagamento...</h1>
                        <p className="text-slate-400">
                            Quase lá! Estamos processando a confirmação do AbacatePay. <br />
                            Isso leva apenas alguns segundos.
                        </p>
                    </motion.div>
                )}

                {status === 'success' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-6"
                    >
                        <div className="w-20 h-20 bg-lime-500/20 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle2 className="w-12 h-12 text-lime-400" />
                        </div>
                        <h1 className="text-3xl font-black text-white">Pagamento Concluído!</h1>
                        <p className="text-slate-300 text-lg">
                            Parabéns! Sua conta premium está ativa. <br />
                            Prepare-se para decolar suas entregas.
                        </p>
                        <div className="pt-4">
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 3 }}
                                    className="h-full bg-lime-500"
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-2 italic">Redirecionando para o Dashboard...</p>
                        </div>
                    </motion.div>
                )}

                {status === 'delay' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-6"
                    >
                        <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto">
                            <Rocket className="w-8 h-8 text-amber-400" />
                        </div>
                        <h1 className="text-xl font-bold text-white">Quase tudo pronto!</h1>
                        <p className="text-slate-400">
                            Seu pagamento foi enviado, mas o sistema está levando um pouco mais de tempo para validar.
                        </p>
                        <button
                            onClick={() => router.push("/dashboard")}
                            className="bg-white text-black px-8 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                        >
                            Ir para o Dashboard agora
                        </button>
                        <p className="text-xs text-slate-500">
                            Se o seu plano não atualizar em 1 minuto, entre em contato com o suporte.
                        </p>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
