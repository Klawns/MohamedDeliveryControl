"use client";

import { motion } from "framer-motion";
import { Save } from "lucide-react";
import { RefObject } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RidePreset } from "../types";
import type { RideFormActions, RideFormState } from "../hooks/use-ride-registration";
import { RideOptionalFields } from "./ride-optional-fields";
import { RidePaymentStatus } from "./ride-payment-status";
import { RideValueSection } from "./ride-value-section";

interface RideFormProps {
    presets: RidePreset[];
    form: RideFormState;
    actions: RideFormActions;
    onDeletePreset: (presetId: string) => void;
    valueSectionRef?: RefObject<HTMLDivElement | null>;
}

export function RideForm({
    presets,
    form,
    actions,
    onDeletePreset,
    valueSectionRef,
}: RideFormProps) {
    return (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="space-y-4"
        >
            <RidePaymentStatus
                paymentStatus={form.paymentStatus}
                onChange={actions.setPaymentStatus}
            />

            <div ref={valueSectionRef} className="scroll-mt-6 sm:scroll-mt-8">
                <RideValueSection
                    presets={presets}
                    form={form}
                    actions={actions}
                    onDeletePreset={onDeletePreset}
                />
            </div>

            <RideOptionalFields form={form} actions={actions} />

            {form.customValue ? (
                <Button
                    className={cn(
                        "h-16 w-full rounded-[2rem] text-sm font-display font-bold uppercase tracking-widest text-primary-foreground shadow-xl transition-all active:scale-[0.98]",
                        form.paymentStatus === "PAID"
                            ? "bg-success shadow-success/20 hover:bg-success/90"
                            : "bg-primary shadow-primary/20 hover:bg-primary/90",
                    )}
                    onClick={actions.submitRide}
                    disabled={form.isSaving || !form.canSubmit}
                >
                    {form.isSaving ? (
                        <span className="flex items-center gap-2">
                            <div className="h-5 w-5 animate-spin rounded-full border-[3px] border-white/30 border-t-white" />
                            Processando
                        </span>
                    ) : (
                        <span className="flex items-center gap-3">
                            <Save size={20} />
                            Salvar Corrida
                        </span>
                    )}
                </Button>
            ) : null}
        </motion.section>
    );
}
