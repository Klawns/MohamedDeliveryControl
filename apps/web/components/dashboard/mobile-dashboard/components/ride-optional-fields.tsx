"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Calendar, Camera, FileText, Trash2 } from "lucide-react";
import Image from "next/image";
import { UPLOAD_IMAGE_ACCEPT } from "@/lib/upload-image";
import type { RideFormActions, RideFormState } from "../hooks/use-ride-registration";

interface RideOptionalFieldsProps {
    form: RideFormState;
    actions: RideFormActions;
}

export function RideOptionalFields({
    form,
    actions,
}: RideOptionalFieldsProps) {
    return (
        <AnimatePresence>
            {form.isValueSelectionComplete ? (
                <motion.div
                    initial={{ opacity: 0, y: 10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: 10, height: 0 }}
                    className="space-y-4 overflow-hidden"
                >
                    <div className="space-y-5 rounded-[2rem] border border-border-subtle bg-card-background p-5 shadow-lg sm:p-6">
                        <div className="flex items-center justify-between">
                            <h3 className="flex items-center gap-2 text-[11px] font-display font-bold uppercase tracking-[0.2em] text-text-secondary">
                                <Calendar size={14} className="text-primary/50" /> Detalhes
                                Opcionais
                            </h3>
                            <label className="cursor-pointer rounded-xl border border-primary/20 bg-primary/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-tight text-primary transition-all active:scale-95">
                                <span className="flex items-center gap-2">
                                    <Camera size={14} />
                                    <span className="hidden sm:inline">Foto</span>
                                </span>
                                <input
                                    type="file"
                                    accept={UPLOAD_IMAGE_ACCEPT}
                                    capture="environment"
                                    className="hidden"
                                    onChange={actions.handlePhotoChange}
                                />
                            </label>
                        </div>

                        <div className="space-y-4">
                            <div className="group relative">
                                <Calendar
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/30 transition-colors group-focus-within:text-primary"
                                    size={16}
                                />
                                <input
                                    type="datetime-local"
                                    value={form.rideDate}
                                    onChange={(event) => actions.setRideDate(event.target.value)}
                                    className="w-full rounded-2xl border border-border bg-background/50 py-3.5 pl-12 pr-4 text-xs text-foreground outline-none transition-all focus:ring-1 focus:ring-primary/30 [color-scheme:dark]"
                                />
                            </div>

                            <AnimatePresence>
                                {form.rideDate ? (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="space-y-4 overflow-hidden"
                                    >
                                        <div className="group relative">
                                            <FileText
                                                className="absolute left-4 top-4 text-primary/30 transition-colors group-focus-within:text-primary"
                                                size={16}
                                            />
                                            <textarea
                                                value={form.notes}
                                                onChange={(event) =>
                                                    actions.setNotes(event.target.value)
                                                }
                                                placeholder="Observações suplementares..."
                                                rows={2}
                                                className="w-full resize-none rounded-2xl border border-border bg-background/50 py-4 pl-12 pr-4 text-xs text-foreground outline-none transition-all placeholder:text-muted-foreground/30 focus:ring-1 focus:ring-primary/30"
                                            />
                                        </div>

                                        {form.photo ? (
                                            <div className="group/photo relative inline-block">
                                                <div className="relative h-24 w-24 overflow-hidden rounded-2xl border border-primary/30 shadow-lg">
                                                    <Image
                                                        src={form.photo}
                                                        alt="Preview"
                                                        fill
                                                        unoptimized
                                                        className="object-cover"
                                                    />
                                                    <button
                                                        onClick={actions.removePhoto}
                                                        className="absolute inset-0 flex items-center justify-center bg-destructive/40 text-white opacity-0 transition-opacity group-hover/photo:opacity-100"
                                                    >
                                                        <Trash2 size={20} />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : null}
                                    </motion.div>
                                ) : null}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );
}
