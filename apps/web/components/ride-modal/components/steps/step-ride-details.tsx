"use client";

import { motion, AnimatePresence } from "framer-motion";
import { DollarSign, Star, MapPin } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { RidePreset } from "@/types/rides";
import { RideFinancialImpactNotice } from "../ride-financial-impact-notice";

const QUICK_VALUES = [10, 12, 15, 20, 25, 30];

interface StepRideDetailsProps {
    presets: RidePreset[];
    value: string;
    setValue: (v: string) => void;
    location: string;
    setLocation: (l: string) => void;
    isCustomValue: boolean;
    setIsCustomValue: (v: boolean) => void;
    clientName?: string;
    willReopenDebtOnSave?: boolean;
    projectedDebtValue?: number;
    handlePresetClick: (preset: RidePreset) => void;
}

export function StepRideDetails({
    presets,
    value,
    setValue,
    location,
    setLocation,
    isCustomValue,
    setIsCustomValue,
    clientName,
    willReopenDebtOnSave = false,
    projectedDebtValue = 0,
    handlePresetClick
}: StepRideDetailsProps) {
    return (
        <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <div className="flex items-center gap-3 bg-secondary/10 p-4 rounded-2xl border border-border-subtle shadow-inner">
                <div className="w-10 h-10 rounded-full bg-icon-info/10 flex items-center justify-center text-icon-info font-bold uppercase text-xs border border-icon-info/10">
                    {clientName?.substring(0, 2) || "CL"}
                </div>
                <div>
                    <p className="text-[9px] font-bold text-text-secondary uppercase tracking-widest leading-none mb-0.5 opacity-70">Cliente Selecionado</p>
                    <p className="text-text-primary font-bold tracking-tight">{clientName || "Cliente"}</p>
                </div>
            </div>

            <div className="space-y-4">
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] pl-1 flex items-center gap-2">
                    <DollarSign size={12} /> Valor e Localização
                </label>

                <div className="grid grid-cols-3 gap-2.5">
                    {QUICK_VALUES.map((v) => {
                        const matchingPreset = presets.find((p) => p.value === v);
                        
                        return (
                            <button
                                key={v}
                                type="button"
                                onClick={() => {
                                    if (matchingPreset) {
                                        handlePresetClick(matchingPreset);
                                    } else {
                                        setValue(String(v));
                                        setIsCustomValue(false);
                                    }
                                }}
                                className={cn(
                                    "p-3.5 rounded-2xl border flex flex-col items-center justify-center transition-all group active:scale-95 shadow-sm",
                                    value === String(v) && !isCustomValue
                                        ? "bg-button-primary border-button-primary text-button-primary-foreground shadow-button-shadow"
                                        : "bg-secondary/10 border-border-subtle text-text-secondary hover:bg-secondary/20 hover:text-text-primary"
                                )}
                            >
                                <span className="text-base font-bold">R$ {v}</span>
                            </button>
                        );
                    })}
                    <button
                        type="button"
                        onClick={() => {
                            setIsCustomValue(true);
                            setValue("");
                            setLocation("");
                        }}
                        className={cn(
                            "p-3.5 rounded-2xl border flex flex-col items-center justify-center transition-all group active:scale-95 shadow-sm",
                            isCustomValue
                                ? "bg-button-primary border-button-primary text-button-primary-foreground shadow-button-shadow"
                                : "bg-secondary/10 border-border-subtle text-text-secondary hover:bg-secondary/20 hover:text-text-primary"
                        )}
                    >
                        <span className="text-sm font-bold uppercase tracking-widest text-[10px]">OUTRO</span>
                    </button>
                </div>

                <div className="flex items-center gap-2 px-1">
                    <Star size={10} className="text-icon-info/50 shadow-sm" />
                    <p className="text-[10px] font-bold text-text-secondary uppercase tracking-tighter opacity-70">
                        Valores e locais fixos podem ser alterados nas <Link href="/dashboard/settings" className="text-icon-info hover:underline hover:opacity-100 transition-all">Configurações</Link>
                    </p>
                </div>

                <AnimatePresence>
                    {(value !== "" || isCustomValue) && (
                        <motion.div
                            initial={{ height: 0, opacity: 0, marginTop: 0 }}
                            animate={{ height: "auto", opacity: 1, marginTop: 16 }}
                            exit={{ height: 0, opacity: 0, marginTop: 0 }}
                            className="overflow-hidden space-y-4"
                        >
                            {isCustomValue && (
                                <div className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-bold text-base opacity-50">R$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={value}
                                        onChange={(e) => { setValue(e.target.value); setIsCustomValue(true); }}
                                        placeholder="Valor Personalizado"
                                        className="w-full bg-secondary/10 border border-border-subtle rounded-2xl py-4 pl-12 pr-4 text-text-primary text-xl font-bold focus:outline-none focus:border-icon-info/50 transition-all placeholder:text-text-secondary/30 shadow-inner"
                                    />
                                </div>
                            )}

                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] pl-1 flex items-center gap-2">
                                    <MapPin size={12} className="text-icon-info" /> Localização da Corrida
                                </label>
                                <input
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="Digite a localização"
                                    className="w-full bg-secondary/10 border border-border-subtle rounded-2xl py-4 px-5 text-text-primary text-sm font-bold focus:outline-none focus:border-icon-info/50 transition-all placeholder:text-text-secondary/30 shadow-inner"
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {willReopenDebtOnSave ? (
                    <RideFinancialImpactNotice debtValue={projectedDebtValue} />
                ) : null}
            </div>
        </motion.div>
    );
}
