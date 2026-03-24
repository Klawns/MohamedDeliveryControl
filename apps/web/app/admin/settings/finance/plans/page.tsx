"use client";

import { useState, useEffect } from "react";
import { api, apiClient } from "@/services/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

function PlanCard({ plan, onSave, isGlobalSaving }: { plan: any, onSave: (id: string, data: any) => Promise<void>, isGlobalSaving: boolean }) {
    const [edited, setEdited] = useState({
        price: plan.price,
        interval: plan.interval || "",
        highlight: plan.highlight
    });
    const [isSaving, setIsSaving] = useState(false);

    // Update local state if the parent plan object changes (e.g. after save/reload)
    useEffect(() => {
        setEdited({
            price: plan.price,
            interval: plan.interval || "",
            highlight: plan.highlight
        });
    }, [plan]);

    const hasChanges = edited.price !== plan.price || edited.interval !== (plan.interval || "") || edited.highlight !== plan.highlight;

    const handleSave = async () => {
        setIsSaving(true);
        await onSave(plan.id, edited);
        setIsSaving(false);
    };

    return (
        <Card className="bg-slate-900/40 border-white/5 flex flex-col">
            <CardHeader>
                <CardTitle className="text-white">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 flex flex-col">
                <div className="space-y-2">
                    <Label>Preço (centavos)</Label>
                    <Input
                        type="number"
                        value={edited.price}
                        onChange={(e) => setEdited({ ...edited, price: Number(e.target.value) })}
                        className="bg-slate-950 border-white/10"
                    />
                    <p className="text-[10px] text-slate-500">Valor atual: {formatCurrency(plan.price / 100)}</p>
                </div>
                <div className="space-y-2">
                    <Label>Intervalo</Label>
                    <Input
                        value={edited.interval}
                        onChange={(e) => setEdited({ ...edited, interval: e.target.value })}
                        placeholder="ex: /mês"
                        className="bg-slate-950 border-white/10"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Destaque</Label>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={edited.highlight}
                            onChange={(e) => setEdited({ ...edited, highlight: e.target.checked })}
                            className="w-4 h-4 rounded border-white/10 bg-slate-950"
                        />
                        <span className="text-sm text-slate-400">Mostrar como recomendado</span>
                    </div>
                </div>
                
                <div className="pt-6 mt-auto">
                    <Button 
                        disabled={!hasChanges || isSaving || isGlobalSaving}
                        onClick={handleSave}
                        className="bg-blue-600 hover:bg-blue-500 text-white w-full"
                    >
                        {isSaving ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                        {isSaving ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

export default function PlansPage() {
    const [plans, setPlans] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadPlans();
    }, []);

    async function loadPlans() {
        try {
            const response = await apiClient.get<any[]>("/admin/settings/plans");
            const plansData = response || [];
            setPlans(plansData.map((p: any) => ({
                ...p,
                features: typeof p.features === 'string' ? JSON.parse(p.features) : p.features
            })));
        } catch (error) {
            console.error("Erro ao carregar planos:", error);
            toast.error("Erro ao carregar planos");
        } finally {
            setIsLoading(false);
        }
    }

    async function handleUpdatePlan(id: string, data: any) {
        setIsSaving(true);
        try {
            await apiClient.patch(`/admin/settings/plans/${id}`, data);
            toast.success("Plano atualizado com sucesso!");
            await loadPlans();
        } catch (error) {
            console.error("Erro ao atualizar plano:", error);
            toast.error("Erro ao atualizar plano");
        } finally {
            setIsSaving(false);
        }
    }

    if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-500" size={32} /></div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white mb-2">Planos de Preços</h1>
                <p className="text-slate-400">Configure os valores e intervalos das assinaturas ativas na plataforma.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {plans.map((plan) => (
                    <PlanCard 
                        key={plan.id} 
                        plan={plan} 
                        onSave={handleUpdatePlan} 
                        isGlobalSaving={isSaving} 
                    />
                ))}
            </div>
        </div>
    );
}
