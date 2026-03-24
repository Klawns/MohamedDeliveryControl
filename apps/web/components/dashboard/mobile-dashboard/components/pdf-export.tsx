"use client";

import { Calendar, FileText, Info, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ridesService } from "@/services/rides-service";
import { PDFService } from "@/services/pdf-service";
import { useToast } from "@/hooks/use-toast";

interface PDFExportProps {
    userName: string;
}

export function PDFExport({ userName }: PDFExportProps) {
    const { toast } = useToast();

    const handleExportPDF = async (period: 'today' | 'week' | 'month') => {
        try {
            const response = await ridesService.getStats({ period });
            const data = response.data;
            if (!data.rides || data.rides.length === 0) {
                toast({ title: "Sem dados para exportar" });
                return;
            }
            toast({ title: "Gerando PDF..." });
            // @ts-ignore - Temporary bypass if PDFService has old types
            await PDFService.generateReport(data.rides, { period, userName: userName || "Motorista" });
        } catch (err) {
            console.error("[PDFExport] Erro ao exportar:", err);
            toast({ title: "Erro ao exportar", variant: "destructive" });
        }
    };

    return (
        <section className="bg-card-background border border-border-subtle p-5 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="text-lg font-display font-extrabold text-text-primary flex items-center gap-2">
                    <FileText size={18} className="text-icon-warning" />
                    Exportar Relatórios
                </h2>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                    { id: 'today', label: 'Hoje' },
                    { id: 'week', label: 'Semana' },
                    { id: 'month', label: 'Mês' }
                ].map(p => (
                    <button
                        key={p.id}
                        onClick={() => handleExportPDF(p.id as any)}
                        className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-muted/50 border border-border-subtle hover:bg-hover-accent active:scale-95 transition-all group"
                    >
                        <Calendar size={18} className="text-text-muted group-hover:text-primary transition-colors" />
                        <span className="text-[10px] font-display font-bold text-text-primary uppercase tracking-tight">
                            {p.label}
                        </span>
                    </button>
                ))}
            </div>

            <div className="bg-icon-warning/5 border border-icon-warning/20 rounded-2xl p-4 flex items-start gap-3 mb-4">
                <Info size={16} className="text-icon-warning shrink-0 mt-0.5" />
                <p className="text-[11px] text-icon-warning font-semibold leading-relaxed">
                    Para exportações detalhadas por cliente ou períodos customizados, acesse o painel financeiro.
                </p>
            </div>

            <div className="pt-4 border-t border-border-subtle text-center">
                <Link href="/dashboard/finance" className="block">
                    <Button className="w-full bg-muted hover:bg-hover-accent text-text-primary font-bold h-12 rounded-2xl text-[10px] gap-2 active:scale-95 transition-all shadow-sm border border-border-subtle uppercase tracking-widest">
                        Acessar Painel Financeiro <ArrowRight size={14} className="text-primary" />
                    </Button>
                </Link>
            </div>
        </section>
    );
}
