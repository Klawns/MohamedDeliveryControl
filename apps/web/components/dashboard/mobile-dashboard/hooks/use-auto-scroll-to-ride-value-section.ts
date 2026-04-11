'use client';

import { RefObject, useEffect, useRef } from 'react';
import { resolveScrollParent } from '@/lib/scroll-parent';
import { isElementTopVisibleWithinBounds } from './use-auto-scroll-to-ride-value-section.utils';

interface UseAutoScrollToRideValueSectionOptions {
    selectedClientId: string | null;
    targetRef: RefObject<HTMLElement | null>;
    scrollParentRef?: RefObject<HTMLElement | null>;
    enabled?: boolean;
}

const CLIENT_GRID_TRANSITION_MS = 320;

function getScrollBehavior(): ScrollBehavior {
    if (typeof window === 'undefined') {
        return 'auto';
    }

    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth';
}

function isTargetVisible(
    target: HTMLElement,
    scrollParent: HTMLElement | null,
) {
    const targetBounds = target.getBoundingClientRect();

    if (!scrollParent) {
        return isElementTopVisibleWithinBounds(targetBounds, {
            top: 0,
            bottom: window.innerHeight,
        });
    }

    const parentBounds = scrollParent.getBoundingClientRect();

    return isElementTopVisibleWithinBounds(targetBounds, {
        top: parentBounds.top,
        bottom: parentBounds.bottom,
    });
}

export function useAutoScrollToRideValueSection({
    selectedClientId,
    targetRef,
    scrollParentRef,
    enabled = true,
}: UseAutoScrollToRideValueSectionOptions) {
    const previousSelectedClientIdRef = useRef<string | null>(null);

    useEffect(() => {
        const hadSelectedClient = previousSelectedClientIdRef.current !== null;
        const hasSelectedClient = selectedClientId !== null;
        previousSelectedClientIdRef.current = selectedClientId;

        if (!enabled || hadSelectedClient || !hasSelectedClient) {
            return;
        }

        let animationFrameId = 0;
        let timeoutId = 0;

        const scrollIfNeeded = () => {
            const target = targetRef.current;

            if (!target) {
                return;
            }

            const scrollParent = resolveScrollParent(
                target,
                scrollParentRef?.current,
            );

            if (isTargetVisible(target, scrollParent)) {
                return;
            }

            target.scrollIntoView({
                behavior: getScrollBehavior(),
                block: 'start',
                inline: 'nearest',
            });
        };

        animationFrameId = window.requestAnimationFrame(() => {
            scrollIfNeeded();
            timeoutId = window.setTimeout(scrollIfNeeded, CLIENT_GRID_TRANSITION_MS);
        });

        return () => {
            window.cancelAnimationFrame(animationFrameId);
            window.clearTimeout(timeoutId);
        };
    }, [enabled, scrollParentRef, selectedClientId, targetRef]);
}
