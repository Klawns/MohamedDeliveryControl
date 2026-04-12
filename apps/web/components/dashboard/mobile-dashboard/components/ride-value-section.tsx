"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Banknote, MapPin, Plus, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { RefObject } from "react";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import type { RideFormActions, RideFormState } from "../hooks/use-ride-registration";
import type { RidePreset } from "../types";
import { QUICK_VALUES } from "../constants";
import { SelectionSummaryCard } from "./selection-summary-card";

interface RideValueSectionProps {
    presets: RidePreset[];
    form: RideFormState;
    actions: RideFormActions;
    onDeletePreset: (presetId: string) => void;
    locationSectionRef?: RefObject<HTMLDivElement | null>;
}

export function RideValueSection({
    presets,
    form,
    actions,
    onDeletePreset,
    locationSectionRef,
}: RideValueSectionProps) {
    const isValueSummaryVisible = form.valueSelectionMode === "summary" && !!form.customValue;
    const isCustomValueEditorVisible = form.valueSelectionMode === "custom-edit";
    const formattedValue =
        isValueSummaryVisible && Number(form.customValue) > 0
            ? formatCurrency(Number(form.customValue))
            : "";

    return (
        <div className="rounded-[2rem] border border-border-subtle bg-card-background p-5 shadow-lg sm:p-6">
            <h2 className="mb-5 flex items-center gap-2 text-sm font-display font-extrabold uppercase tracking-wider text-text-primary">
                <MapPin size={16} className="text-primary" /> Valor e Local
            </h2>

            {form.valueSelectionMode === "picker" ? (
                <div className="mb-5 grid grid-cols-3 gap-2.5">
                    {QUICK_VALUES.map((value) => {
                        const matchingPreset = presets.find((preset) => preset.value === value);
                        const displayId = matchingPreset?.id || `default-${value}`;

                        return (
                            <div key={displayId} className="group/preset relative">
                                <button
                                    type="button"
                                    onClick={() =>
                                        actions.handlePresetSelect(
                                            displayId,
                                            value,
                                            matchingPreset?.location,
                                        )
                                    }
                                    className={cn(
                                        "flex aspect-square w-full flex-col items-center justify-center rounded-2xl border border-border-subtle bg-muted/50 p-2 text-center shadow-sm transition-all active:scale-95 hover:bg-hover-accent",
                                    )}
                                >
                                    <div className="text-lg font-display font-extrabold tracking-tighter text-primary">
                                        R$ {value}
                                    </div>
                                </button>
                                {matchingPreset ? (
                                    <button
                                        type="button"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            onDeletePreset(matchingPreset.id);
                                        }}
                                        className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-lg opacity-0 transition-all active:scale-90 group-hover/preset:opacity-100"
                                    >
                                        <Trash2 size={10} strokeWidth={3} />
                                    </button>
                                ) : null}
                            </div>
                        );
                    })}
                    <button
                        type="button"
                        onClick={actions.startCustomValueEntry}
                        className="aspect-square rounded-2xl border border-border bg-accent/50 p-2 text-left text-muted-foreground transition-all active:scale-95 hover:bg-accent"
                    >
                        <div className="flex h-full flex-col items-center justify-center">
                            <Plus size={18} />
                            <span className="mt-1 text-[10px] font-display font-bold uppercase">
                                Outro
                            </span>
                        </div>
                    </button>
                </div>
            ) : null}

            <div className="mb-2 flex items-center gap-2 px-1">
                <Star size={10} className="text-primary/50 underline" />
                <p className="text-[9px] font-bold uppercase leading-tight tracking-tighter text-muted-foreground">
                    Configure locais fixos em{" "}
                    <Link href="/dashboard/settings" className="text-primary hover:underline">
                        Ajustes
                    </Link>
                </p>
            </div>

            <AnimatePresence>
                {isCustomValueEditorVisible ? (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-4 overflow-hidden pt-4"
                    >
                        <div className="space-y-2">
                            <label className="pl-1 text-[10px] font-bold uppercase tracking-widest text-text-muted">
                                Valor Personalizado
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-bold text-text-muted">
                                    R$
                                </span>
                                <input
                                    type="number"
                                    value={form.customValue}
                                    onChange={(event) =>
                                        actions.setCustomValue(event.target.value)
                                    }
                                    placeholder="0,00"
                                    className="w-full rounded-2xl border border-border-subtle bg-background py-4 pl-12 pr-4 text-xl font-display font-extrabold text-text-primary shadow-inner outline-none focus:border-primary/50"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                className="rounded-2xl"
                                onClick={actions.resetValueSelection}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="button"
                                className="rounded-2xl"
                                onClick={actions.confirmCustomValue}
                                disabled={Number(form.customValue) <= 0}
                            >
                                Aplicar
                            </Button>
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>

            <AnimatePresence>
                {isValueSummaryVisible ? (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-4 overflow-hidden pt-4"
                    >
                        <SelectionSummaryCard
                            title={formattedValue}
                            description="Valor selecionado"
                            icon={Banknote}
                            onClick={actions.resetValueSelection}
                            ariaLabel={`Trocar valor ${formattedValue}`}
                        />

                        <div
                            ref={locationSectionRef}
                            className="space-y-2 scroll-mt-6 sm:scroll-mt-8"
                        >
                            <label className="pl-1 text-[10px] font-bold uppercase tracking-widest text-text-muted">
                                Localizacao da Corrida
                            </label>
                            <div className="group relative">
                                <MapPin
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/50 transition-colors group-focus-within:text-primary"
                                    size={18}
                                />
                                <input
                                    type="text"
                                    value={form.customLocation}
                                    onChange={(event) =>
                                        actions.setCustomLocation(event.target.value)
                                    }
                                    placeholder="Destino ou Ponto de Partida"
                                    className="w-full rounded-2xl border border-border bg-background py-4 pl-12 pr-4 text-sm font-bold text-foreground shadow-inner outline-none focus:border-primary/50"
                                />
                            </div>
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    );
}
