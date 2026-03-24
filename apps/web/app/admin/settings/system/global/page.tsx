"use client";

import { useState, useEffect } from "react";
import { api, apiClient } from "@/services/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Smartphone, Mail } from "lucide-react";

export default function GlobalSettingsPage() {
    const [configs, setConfigs] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadConfigs();
    }, []);

    async function loadConfigs() {
        try {
            const data = await apiClient.get<Record<string, string>>("/admin/settings/configs");
            setConfigs(data);
        } catch (error) {
            console.error("Erro ao carregar configs:", error);
            toast.error("Erro ao carregar configurações");
        } finally {
            setIsLoading(false);
        }
    }

    async function handleUpdateConfig(key: string, value: string) {
        setIsSaving(true);
        try {
            await apiClient.post("/admin/settings/configs", { key, value });
            toast.success(`${key} atualizado!`);
        } catch (error) {
            toast.error("Erro ao salvar");
        } finally {
            setIsSaving(false);
        }
    }

    if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-500" size={32} /></div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white mb-2">Configurações Globais</h1>
                <p className="text-slate-400">Valores globais utilizados em toda a plataforma.</p>
            </div>
            <Card className="bg-slate-900/40 border-white/5 max-w-2xl">
                <CardHeader>
                    <CardTitle className="text-white">Opções Gerais</CardTitle>
                    <CardDescription>Estes parâmetros afetam contatos listados publicamente na plataforma.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2"><Smartphone size={16} className="text-emerald-400" /> WhatsApp de Suporte</Label>
                        <Input
                            defaultValue={configs['SUPPORT_WHATSAPP'] || ""}
                            onBlur={(e) => handleUpdateConfig('SUPPORT_WHATSAPP', e.target.value)}
                            placeholder="https://wa.me/..."
                            className="bg-slate-950 border-white/10"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2"><Mail size={16} className="text-blue-400" /> E-mail de Suporte</Label>
                        <Input
                            defaultValue={configs['SUPPORT_EMAIL'] || ""}
                            onBlur={(e) => handleUpdateConfig('SUPPORT_EMAIL', e.target.value)}
                            placeholder="suporte@..."
                            className="bg-slate-950 border-white/10"
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
