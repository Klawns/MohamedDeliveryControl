"use client";

import { cn } from "@/lib/utils";

interface ProgressBarProps {
    currentStep: number;
    totalSteps: number;
}

export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
    const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);

    return (
        <div className="flex gap-2 mb-2">
            {steps.map((s) => (
                <div
                    key={s}
                    className={cn(
                        "h-1.5 flex-1 rounded-full transition-all duration-500",
                        s <= currentStep 
                            ? "bg-button-primary shadow-lg shadow-button-shadow" 
                            : "bg-secondary/10"
                    )}
                />
            ))}
        </div>
    );
}
