"use client";

import { useIsMobile } from "@/hooks/use-mobile";

/**
 * Hook especializado para gerenciar o estado da interface (UI) do dashboard.
 * Encapsula detecção de dispositivo móvel.
 */
export function useDashboardUI() {
    const isMobile = useIsMobile();

    return {
        isMobile
    };
}
