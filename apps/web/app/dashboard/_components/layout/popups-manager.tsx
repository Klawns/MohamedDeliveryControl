"use client";

import { useEffect, useState } from "react";
import { TutorialModal } from "@/components/dashboard/tutorial-modal";
import { StarterLimitPopup } from "@/components/dashboard/starter-limit-popup";
import { SubscriptionExpiringPopup } from "@/components/dashboard/subscription-expiring-popup";
import { api, apiClient } from "@/services/api";
import { User } from "@/hooks/use-auth";

interface PopupsManagerProps {
    user: User | null;
    isLoading: boolean;
    updateUser: (user: User) => void;
    showExpiringPopup: boolean;
    daysRemaining: number;
}

/**
 * Gerenciador centralizado de Popups e Modais do Dashboard.
 * Isola a lógica de visibilidade e interações de tutorial do layout principal.
 */
export function PopupsManager({ 
    user, 
    isLoading, 
    updateUser, 
    showExpiringPopup, 
    daysRemaining 
}: PopupsManagerProps) {
    const [isTutorialOpen, setIsTutorialOpen] = useState(false);

    useEffect(() => {
        if (!isLoading && user && !user.hasSeenTutorial && user.role === 'user') {
            const hasActivePlan = user.subscription?.status === 'active' || user.subscription?.status === 'trial';
            if (hasActivePlan) {
                setIsTutorialOpen(true);
            }
        }
    }, [isLoading, user]);

    async function handleCloseTutorial() {
        setIsTutorialOpen(false);
        if (!user) return;
        
        try {
            await apiClient.patch("/settings/tutorial-seen");
            updateUser({ ...user, hasSeenTutorial: true });
        } catch (err) {
            console.error("[PopupsManager] Erro ao marcar tutorial como visto:", err);
        }
    }

    return (
        <>
            <TutorialModal isOpen={isTutorialOpen} onClose={handleCloseTutorial} />

            {user?.subscription?.plan === 'starter' && user?.subscription?.status === 'active' && (
                <StarterLimitPopup rideCount={user.subscription.rideCount || 0} />
            )}

            {showExpiringPopup && (
                <SubscriptionExpiringPopup daysRemaining={daysRemaining} />
            )}
        </>
    );
}
