"use client";

import { useState, useEffect } from "react";
import { api, apiClient } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, Plus, Ticket, Percent, Hash } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function CouponsPage() {
    const [coupons, setCoupons] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Form state
    const [code, setCode] = useState("");
    const [notes, setNotes] = useState("");
    const [discountKind, setDiscountKind] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
    const [discount, setDiscount] = useState(0);
    const [maxRedeems, setMaxRedeems] = useState(0);

    useEffect(() => {
        loadCoupons();
    }, []);

    async function loadCoupons() {
        try {
            const data = await apiClient.get<any[]>("/admin/settings/promo-codes");
            setCoupons(data || []);
        } catch (error) {
            console.error("Erro ao carregar cupons:", error);
            toast.error("Erro ao carregar cupons");
        } finally {
            setIsLoading(false);
        }
    }

    async function handleCreateCoupon(e: React.FormEvent) {
        e.preventDefault();

        if (discount < 0) {
            toast.error("O desconto não pode ser negativo");
            return;
        }

        if (maxRedeems < 0) {
            toast.error("O limite de usos não pode ser negativo");
            return;
        }

        setIsCreating(true);
        try {
            await apiClient.post("/admin/settings/promo-codes", {
                code,
                notes,
                discountKind,
                discount: Number(discount),
                maxRedeems: maxRedeems > 0 ? Number(maxRedeems) : undefined,
            });
            toast.success("Cupom criado com sucesso!");
            setIsDialogOpen(false);
            loadCoupons();
            // Reset form
            setCode("");
            setNotes("");
            setDiscount(0);
            setMaxRedeems(0);
        } catch (error) {
            console.error("Erro ao criar cupom:", error);
            toast.error("Erro ao criar cupom");
        } finally {
            setIsCreating(false);
        }
    }

    if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-500" size={32} /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">Cupons e Descontos</h1>
                    <p className="text-slate-400">Emita códigos de desconto sincronizados com o AbacatePay.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-500 text-white gap-2">
                            <Plus size={16} /> Novo Cupom
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-900 border-white/10 text-white">
                        <DialogHeader>
                            <DialogTitle>Criar Novo Cupom</DialogTitle>
                            <DialogDescription>
                                Preencha os detalhes para gerar um novo cupom.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateCoupon} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2"><Ticket size={14} /> Código do Cupom</Label>
                                <Input
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                                    placeholder="EX: PROMO2024"
                                    required
                                    className="bg-slate-950 border-white/10"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Descrição (Notas)</Label>
                                <Input
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="O que esse cupom oferece?"
                                    className="bg-slate-950 border-white/10"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2"><Percent size={14} /> Tipo de Desconto</Label>
                                    <Select value={discountKind} onValueChange={(v: any) => setDiscountKind(v)}>
                                        <SelectTrigger className="bg-slate-950 border-white/10 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-white/10 text-white">
                                            <SelectItem value="PERCENTAGE">Porcentagem</SelectItem>
                                            <SelectItem value="FIXED">Valor Fixo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Valor do Desconto</Label>
                                    <Input
                                        type="number"
                                        value={discount}
                                        onChange={(e) => setDiscount(Number(e.target.value))}
                                        placeholder={discountKind === "PERCENTAGE" ? "Ex: 10 (%)" : "Ex: 500 (cents)"}
                                        required
                                        min="0"
                                        className="bg-slate-950 border-white/10"
                                    />
                                    <p className="text-[10px] text-slate-500">
                                        {discountKind === "PERCENTAGE" ? "Em porcentagem (ex: 10 para 10%)" : "Em centavos (ex: 500 para R$ 5,00)"}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2"><Hash size={14} /> Limite de Usos (Opcional)</Label>
                                <Input
                                    type="number"
                                    value={maxRedeems}
                                    onChange={(e) => setMaxRedeems(Number(e.target.value))}
                                    placeholder="0 para ilimitado"
                                    min="0"
                                    className="bg-slate-950 border-white/10"
                                />
                            </div>
                            <DialogFooter className="pt-4">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setIsDialogOpen(false)}
                                    className="text-slate-400 hover:text-white"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isCreating}
                                    className="bg-blue-600 hover:bg-blue-500 text-white"
                                >
                                    {isCreating ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save className="mr-2" size={16} />}
                                    Criar Cupom
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {coupons.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-slate-500 border border-dashed border-white/5 rounded-[2rem]">
                        Nenhum cupom emitido até agora.
                    </div>
                ) : (
                    coupons.map((coupon) => (
                        <Card key={coupon.id} className="bg-slate-900/40 border-white/5">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xl font-bold font-mono text-lime-400">{coupon.code}</CardTitle>
                                <Ticket size={18} className="text-slate-500" />
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="text-sm text-slate-400">{coupon.notes}</div>
                                <div className="flex items-center gap-2">
                                    <div className="text-2xl font-bold text-white">
                                        {coupon.discountKind === "PERCENTAGE" ? `${coupon.discount}%` : formatCurrency(coupon.discount / 100)}
                                    </div>
                                    <div className="text-xs text-slate-500 uppercase tracking-wider">de desconto</div>
                                </div>
                                <div className="text-xs text-slate-500">
                                    {coupon.useCount || 0} de {coupon.maxRedeems || "∞"} usos realizados
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
