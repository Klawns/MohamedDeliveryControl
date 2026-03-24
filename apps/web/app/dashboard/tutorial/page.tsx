"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useTutorial } from "./_hooks/use-tutorial";
import { useSimulator } from "./_hooks/use-simulator";
import { getTutorialSteps } from "./_constants/tutorial-steps";
import { TutorialProgress } from "./_components/tutorial-progress";
import { TutorialHeader } from "./_components/tutorial-header";
import { TutorialFooter } from "./_components/tutorial-footer";

export default function TutorialPage() {
    const {
        simClients,
        selectedClient,
        setSelectedClient,
        simPresets,
        addClient,
        addPreset,
        setIsFinished
    } = useSimulator();

    const {
        currentStep,
        next,
        prev
    } = useTutorial(6); // Total 6 steps

    const steps = getTutorialSteps({
        simPresets,
        addPreset,
        selectedClient,
        setSelectedClient,
        simClients,
        addClient,
        setIsFinished,
        next
    });

    const currentStepData = steps[currentStep];
    const CurrentIcon = currentStepData.icon;

    // Logic for "canContinue" on step 2 (Simulator: Cadastro)
    const canContinue = currentStep !== 2 || !!selectedClient;

    return (
        <div className="max-w-2xl mx-auto min-h-[90vh] flex flex-col justify-center py-4 md:py-12 px-4 text-white">
            <TutorialProgress 
                currentStep={currentStep} 
                totalSteps={steps.length} 
            />

            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ ease: "circOut", duration: 0.5 }}
                    className="flex-1 space-y-4 md:space-y-10"
                >
                    <TutorialHeader 
                        title={currentStepData.title} 
                        Icon={currentStepData.icon} 
                    />

                    <div className="min-h-[250px] md:min-h-[350px]">
                        {currentStepData.content}
                    </div>
                </motion.div>
            </AnimatePresence>

            <TutorialFooter
                currentStep={currentStep}
                totalSteps={steps.length}
                onPrev={prev}
                onNext={next}
                canContinue={canContinue}
            />

            {/* Custom Animations Style */}
            <style jsx global>{`
                @keyframes pulse-shadow {
                    0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
                    70% { box-shadow: 0 0 0 15px rgba(245, 158, 11, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
                }
                .pulse-shadow {
                    animation: pulse-shadow 2s infinite;
                }
                .shadow-3xl {
                    box-shadow: 0 25px 50px -12px rgba(37, 99, 235, 0.2);
                }
            `}</style>
        </div>
    );
}
