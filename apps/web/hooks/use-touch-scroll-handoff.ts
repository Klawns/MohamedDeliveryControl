"use client";

import { RefObject, useEffect, useEffectEvent, useRef } from "react";
import {
  getElementScrollMetrics,
  shouldHandoffScroll,
} from "@/lib/scroll-boundary";
import { resolveScrollParent } from "@/lib/scroll-parent";

interface UseTouchScrollHandoffOptions {
  containerRef: RefObject<HTMLElement | null>;
  parentRef?: RefObject<HTMLElement | null>;
  enabled?: boolean;
}

export function useTouchScrollHandoff({
  containerRef,
  parentRef,
  enabled = true,
}: UseTouchScrollHandoffOptions) {
  const lastTouchYRef = useRef<number | null>(null);

  const handleTouchStart = useEffectEvent((event: TouchEvent) => {
    if (!enabled || event.touches.length !== 1) {
      lastTouchYRef.current = null;
      return;
    }

    lastTouchYRef.current = event.touches[0].clientY;
  });

  const handleTouchMove = useEffectEvent((event: TouchEvent) => {
    if (event.defaultPrevented || event.touches.length !== 1) {
      return;
    }

    const container = containerRef.current;

    if (!enabled || !container) {
      return;
    }

    const currentTouchY = event.touches[0].clientY;
    const lastTouchY = lastTouchYRef.current;

    lastTouchYRef.current = currentTouchY;

    if (lastTouchY === null) {
      return;
    }

    const deltaY = lastTouchY - currentTouchY;

    if (deltaY === 0) {
      return;
    }

    const parent = resolveScrollParent(container, parentRef?.current);

    if (
      !parent ||
      !shouldHandoffScroll(getElementScrollMetrics(container), deltaY)
    ) {
      return;
    }

    event.preventDefault();
    parent.scrollBy({ top: deltaY, left: 0, behavior: "auto" });
  });

  const clearTouchState = useEffectEvent(() => {
    lastTouchYRef.current = null;
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const container = containerRef.current;

    if (!container) {
      return;
    }

    container.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    container.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    container.addEventListener("touchend", clearTouchState);
    container.addEventListener("touchcancel", clearTouchState);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", clearTouchState);
      container.removeEventListener("touchcancel", clearTouchState);
    };
  }, [containerRef, enabled]);
}
