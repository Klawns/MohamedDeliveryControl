'use client';

import { RefObject, useEffect, useRef } from 'react';

const LOCATION_SECTION_EXPANSION_MS = 220;

function getScrollBehavior(): ScrollBehavior {
    if (typeof window === 'undefined') {
        return 'auto';
    }

    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth';
}

interface UseAutoScrollToRideLocationOptions {
    selectedValueKey: string | null;
    targetRef: RefObject<HTMLElement | null>;
    enabled?: boolean;
}

export function useAutoScrollToRideLocation({
    selectedValueKey,
    targetRef,
    enabled = true,
}: UseAutoScrollToRideLocationOptions) {
    const previousSelectedValueKeyRef = useRef<string | null>(null);

    useEffect(() => {
        const hadSelectedValue = previousSelectedValueKeyRef.current !== null;
        const hasSelectedValue = selectedValueKey !== null;
        previousSelectedValueKeyRef.current = selectedValueKey;

        if (!enabled || hadSelectedValue || !hasSelectedValue) {
            return;
        }

        let animationFrameId = 0;
        let timeoutId = 0;

        const scrollToLocation = () => {
            const target = targetRef.current;

            if (!target) {
                return;
            }

            target.scrollIntoView({
                behavior: getScrollBehavior(),
                block: 'nearest',
                inline: 'nearest',
            });
        };

        animationFrameId = window.requestAnimationFrame(() => {
            scrollToLocation();
            timeoutId = window.setTimeout(scrollToLocation, LOCATION_SECTION_EXPANSION_MS);
        });

        return () => {
            window.cancelAnimationFrame(animationFrameId);
            window.clearTimeout(timeoutId);
        };
    }, [enabled, selectedValueKey, targetRef]);
}
