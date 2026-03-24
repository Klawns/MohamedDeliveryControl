"use client";

import { AnimatePresence } from "framer-motion";
import { X, Bike } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

import { RideModalProps } from "@/types/rides";
import { useRideForm } from "./ride-modal/hooks/use-ride-form";
import { ProgressBar } from "./ride-modal/components/progress-bar";
import { NavigationButtons } from "./ride-modal/components/navigation-buttons";

// Step Components
import { StepClientSelection } from "./ride-modal/components/steps/step-client-selection";
import { StepRideDetails } from "./ride-modal/components/steps/step-ride-details";
import { StepPaymentStatus } from "./ride-modal/components/steps/step-payment-status";
import { StepExtraInfo } from "./ride-modal/components/steps/step-extra-info";
import { StepReview } from "./ride-modal/components/steps/step-review";

export function RideModal(props: RideModalProps) {
    const { isOpen, onClose, rideToEdit, clientName } = props;
    const form = useRideForm(props);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent showCloseButton={false} className="bg-modal-background border-border p-0 overflow-hidden sm:rounded-[2.5rem] w-[calc(100%-2rem)] max-w-lg sm:max-w-[480px] gap-0 shadow-2xl">
                <DialogHeader className="sr-only">
                    <DialogTitle>{rideToEdit ? 'Editar Corrida' : 'Nova Corrida'}</DialogTitle>
                    <DialogDescription>
                        {rideToEdit ? 'Altere as informações da corrida selecionada.' : 'Registre uma nova corrida no sistema.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col h-full max-h-[90vh] sm:max-h-[85vh] relative bg-modal-background">
                    <div className="sm:hidden w-12 h-1.5 bg-border-subtle rounded-full mx-auto my-4 shrink-0" />

                    <div className="px-6 sm:px-10 pt-4 sm:pt-10 pb-4 shrink-0 relative">
                        <button
                            onClick={onClose}
                            className="absolute right-6 top-4 sm:right-10 sm:top-8 z-20 p-2.5 bg-secondary/10 hover:bg-secondary/20 rounded-xl text-text-secondary hover:text-text-primary transition-all active:scale-95 group border border-border-subtle shadow-lg"
                            title="Fechar"
                        >
                            <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                        </button>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-12 w-12 bg-icon-info/10 rounded-2xl flex items-center justify-center text-icon-info font-black shadow-inner border border-icon-info/10">
                                <Bike size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl sm:text-2xl font-display font-extrabold text-text-primary tracking-tighter leading-none">
                                    {rideToEdit ? 'Editar Corrida' : 'Nova Corrida'}
                                </h2>
                                <p className="text-text-secondary text-[10px] sm:text-xs mt-2 uppercase tracking-[0.2em] font-bold opacity-80">
                                    Passo {form.currentStep} de 5
                                </p>
                            </div>
                        </div>

                        <ProgressBar currentStep={form.currentStep} totalSteps={5} />
                    </div>

                    <div className={cn(
                        "px-6 sm:px-10 flex-1 scrollbar-hide min-h-0",
                        form.currentStep === 1 ? "overflow-hidden" : "overflow-y-auto"
                    )}>
                        <form 
                            onSubmit={(e) => e.preventDefault()} 
                            onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                            className="space-y-6 sm:space-y-8 pb-10"
                        >
                            <AnimatePresence mode="wait">
                                {form.currentStep === 1 && (
                                    <StepClientSelection 
                                        {...form}
                                        onNext={form.nextStep}
                                    />
                                )}

                                {form.currentStep === 2 && (
                                    <StepRideDetails 
                                        {...form}
                                        clientName={form.clients.find(c => c.id === form.selectedClientId)?.name || clientName}
                                    />
                                )}

                                {form.currentStep === 3 && (
                                    <StepPaymentStatus 
                                        paymentStatus={form.paymentStatus}
                                        setPaymentStatus={form.setPaymentStatus}
                                    />
                                )}

                                {form.currentStep === 4 && (
                                    <StepExtraInfo {...form} />
                                )}

                                {form.currentStep === 5 && (
                                    <StepReview 
                                        {...form}
                                        clientName={form.clients.find(c => c.id === form.selectedClientId)?.name || clientName}
                                    />
                                )}
                            </AnimatePresence>
                        </form>
                    </div>

                    <div className="px-6 sm:px-10 py-6 sm:py-8 bg-modal-background/80 backdrop-blur-md border-t border-border shrink-0 z-10">
                        <NavigationButtons 
                            currentStep={form.currentStep}
                            totalSteps={5}
                            onBack={form.prevStep}
                            onNext={form.nextStep}
                            onSubmit={form.handleSubmit}
                            isSubmitting={form.isSubmitting}
                            canNext={
                                (form.currentStep === 1 && !!form.selectedClientId) ||
                                (form.currentStep === 2 && !!form.value) ||
                                (form.currentStep > 2)
                            }
                            rideToEdit={!!rideToEdit}
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
