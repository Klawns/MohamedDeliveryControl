"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TutorialFooterProps {
    currentStep: number;
    totalSteps: number;
    onPrev: () => void;
    onNext: () => void;
    canContinue: boolean;
}

export function TutorialFooter({
    currentStep,
    totalSteps,
    onPrev,
    onNext,
    canContinue
}: TutorialFooterProps) {
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === totalSteps - 1;

    return (
        <footer className="mt-6 md:mt-14 pt-4 md:pt-10 border-t border-white/5 flex flex-col-reverse sm:flex-row gap-3 md:gap-4">
            {!isFirstStep && (
                <Button
                    variant="ghost"
                    onClick={onPrev}
                    className="h-11 md:h-16 px-4 md:px-8 rounded-xl md:rounded-3xl text-slate-500 hover:text-white font-black scale-95 hover:scale-100 transition-all uppercase tracking-widest text-[9px] md:text-xs text-center"
                >
                    <ArrowLeft className="mr-2 md:mr-3 shrink-0" size={14} /> Voltar
                </Button>
            )}

            {!isLastStep ? (
                <Button
                    onClick={onNext}
                    disabled={!canContinue}
                    className="h-12 md:h-16 flex-1 bg-white text-slate-950 hover:bg-slate-200 font-black rounded-xl md:rounded-3xl text-xs md:text-lg shadow-2xl transition-all active:scale-95 group uppercase tracking-tight"
                >
                    {canContinue ? "Continuar" : "Complete os passos acima"} 
                    <ArrowRight className="ml-2 md:ml-3 group-hover:translate-x-1 transition-transform shrink-0" size={16} />
                </Button>
            ) : (
                <Link href="/dashboard" className="flex-1">
                    <Button
                        className="w-full h-12 md:h-16 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-black rounded-xl md:rounded-3xl text-base md:text-xl shadow-2xl shadow-blue-600/30 active:scale-95 group uppercase tracking-tighter italic"
                    >
                        Começar Agora <CheckCircle2 className="ml-2 md:ml-3 shrink-0" size={20} />
                    </Button>
                </Link>
            )}
        </footer>
    );
}
