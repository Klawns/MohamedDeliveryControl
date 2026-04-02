"use client";

import { useState } from "react";
import { Settings2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SettingsTabs } from "./_components/settings-tabs";
import { BackupsSettings } from "./_components/backups-settings";
import { GeneralSettings } from "./_components/general-settings";
import { DangerZone } from "./_components/danger-zone";

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState("general");

    const renderContent = () => {
        switch (activeTab) {
            case "general":
                return <GeneralSettings />;
            case "backups":
                return <BackupsSettings />;
            case "danger":
                return <DangerZone />;
            default:
                return <GeneralSettings />;
        }
    };

    return (
        <div className="mx-auto flex w-full max-w-5xl min-h-0 flex-1 flex-col gap-10 px-4 sm:px-6">
            <div className="flex flex-col gap-10">
                <div className="flex flex-col gap-8 border-b border-border pb-10 md:flex-row md:items-end md:justify-between">
                    <div className="space-y-4">
                        <h2 className="flex items-center gap-4 text-4xl font-display font-black tracking-tight text-text-primary">
                            <div className="transform rounded-2xl bg-primary p-3 shadow-xl shadow-primary/20 transition-transform hover:rotate-0 -rotate-3">
                                <Settings2 size={28} className="text-primary-foreground" />
                            </div>
                            Configuracoes
                        </h2>
                        <p className="border-l-2 border-primary/30 pl-2 text-lg font-medium text-text-secondary opacity-80">
                            Personalize sua experiencia e gerencie sua conta.
                        </p>
                    </div>

                    <SettingsTabs activeTab={activeTab} onTabChange={setActiveTab} />
                </div>

                <main
                    className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-32 scrollbar-hide"
                    data-scroll-lock-root="true"
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 10, filter: "blur(10px)" }}
                            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                            exit={{ opacity: 0, x: -10, filter: "blur(10px)" }}
                            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                        >
                            {renderContent()}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}
