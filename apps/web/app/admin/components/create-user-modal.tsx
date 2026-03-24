"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Loader2 } from "lucide-react";
import { api, apiClient } from "@/services/api";

interface CreateUserModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function CreateUserModal({ open, onOpenChange, onSuccess }: CreateUserModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        try {
            await apiClient.post("/admin/users", { name, email, password });
            onSuccess();
            onOpenChange(false);
            (e.target as HTMLFormElement).reset();
        } catch (err: any) {
            console.error("Erro ao criar usuário:", err);
            setError(err.response?.data?.message || "Ocorreu um erro ao criar o usuário.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => !isLoading && onOpenChange(val)}>
            <DialogContent className="bg-slate-900 border-white/10 text-white max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2 text-blue-400">
                        <UserPlus size={24} />
                        Cadastrar Novo Usuário
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Preencha os dados abaixo para criar uma conta manualmente para o cliente.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-semibold">Nome Completo</Label>
                        <Input
                            id="name"
                            name="name"
                            required
                            placeholder="Nome do cliente"
                            className="bg-slate-950 border-white/5 focus:ring-blue-500/50"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-semibold">E-mail</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            required
                            placeholder="cliente@email.com"
                            className="bg-slate-950 border-white/5 focus:ring-blue-500/50"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-semibold">Senha Inicial</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            required
                            placeholder="••••••"
                            className="bg-slate-950 border-white/5 focus:ring-blue-500/50"
                        />
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <DialogFooter className="pt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                            className="border-white/10 text-white hover:bg-white/5"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold gap-2 min-w-[120px]"
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin" size={18} />
                            ) : (
                                "Criar Usuário"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
