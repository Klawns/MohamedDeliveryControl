"use client";

import { ChevronRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavigationButtonsProps {
    currentStep: number;
    totalSteps: number;
    onBack: () => void;
    onNext: () => void;
    onSubmit: () => void;
    isSubmitting: boolean;
    canNext: boolean;
    rideToEdit?: boolean;
}

export function NavigationButtons({
    currentStep,
    totalSteps,
    onBack,
    onNext,
    onSubmit,
    isSubmitting,
    canNext,
    rideToEdit
}: NavigationButtonsProps) {
    return (
        <div className="flex gap-3">
            {currentStep > 1 && (
                <button
                    type="button"
                    onClick={onBack}
                    className="h-14 px-6 rounded-2xl bg-secondary/10 border border-border-subtle text-text-secondary font-bold hover:bg-secondary/20 active:scale-95 transition-all shadow-sm"
                >
                    <ChevronRight size={20} className="rotate-180" />
                </button>
            )}

            {currentStep < totalSteps ? (
                <button
                    type="button"
                    onClick={onNext}
                    disabled={!canNext}
                    className="flex-1 h-14 bg-button-primary hover:bg-button-primary-hover text-button-primary-foreground font-bold rounded-2xl shadow-lg shadow-button-shadow flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-30 uppercase tracking-widest text-xs"
                >
                    {currentStep === 4 ? "REVISAR" : "CONTINUAR"}
                    <ChevronRight size={20} />
                </button>
            ) : (
                <button
                    type="button"
                    onClick={onSubmit}
                    disabled={isSubmitting}
                    className="flex-1 h-14 bg-button-primary hover:bg-button-primary-hover text-button-primary-foreground font-bold rounded-2xl shadow-lg shadow-button-shadow flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50 uppercase tracking-widest text-xs"
                >
                    {isSubmitting ? (
                        <div className="h-6 w-6 border-[3px] border-button-primary-foreground/30 border-t-button-primary-foreground rounded-full animate-spin"></div>
                    ) : (
                        <>
                            {rideToEdit ? 'SALVAR ALTERAÇÕES' : 'CONFIRMAR E REGISTRAR'}
                            <CheckCircle2 size={24} />
                        </>
                    )}
                </button>
            )}
        </div>
    );
}
