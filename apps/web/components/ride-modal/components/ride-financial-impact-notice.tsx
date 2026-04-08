"use client";

import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn, formatCurrency } from "@/lib/utils";

interface RideFinancialImpactNoticeProps {
    debtValue: number;
    className?: string;
}

export function RideFinancialImpactNotice({
    debtValue,
    className,
}: RideFinancialImpactNoticeProps) {
    return (
        <Alert className={cn("border-warning/25 bg-warning/5 text-text-primary [&>svg]:text-warning", className)}>
            <AlertTriangle className="mt-0.5" />
            <AlertTitle className="text-[11px] font-black uppercase tracking-[0.18em] text-warning">
                Esta edicao reabre a pendencia
            </AlertTitle>
            <AlertDescription className="text-text-secondary">
                <p>Alterar cliente ou valor faz o sistema recalcular a quitacao da corrida.</p>
                <p>Se salvar assim, ela volta para pendente com {formatCurrency(debtValue)} em aberto.</p>
            </AlertDescription>
        </Alert>
    );
}
