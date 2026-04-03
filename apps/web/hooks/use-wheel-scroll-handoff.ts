"use client";

import { RefObject, useEffect, useEffectEvent } from "react";
import {
  getElementScrollMetrics,
  normalizeWheelDelta,
  shouldHandoffScroll,
} from "@/lib/scroll-boundary";
import { resolveScrollParent } from "@/lib/scroll-parent";

interface UseWheelScrollHandoffOptions {
  containerRef: RefObject<HTMLElement | null>;
  parentRef?: RefObject<HTMLElement | null>;
  enabled?: boolean;
}

export function useWheelScrollHandoff({
  containerRef,
  parentRef,
  enabled = true,
}: UseWheelScrollHandoffOptions) {
  const handleWheel = useEffectEvent((event: WheelEvent) => {
    if (event.defaultPrevented) {
      return;
    }

    const container = containerRef.current;

    if (!enabled || !container) {
      return;
    }

    const parent = resolveScrollParent(container, parentRef?.current);

    if (!parent) {
      return;
    }

    const deltaY = normalizeWheelDelta(event, container.clientHeight);

    if (
      !shouldHandoffScroll(
        getElementScrollMetrics(container),
        deltaY,
      )
    ) {
      return;
    }

    event.preventDefault();
    parent.scrollBy({ top: deltaY, left: 0, behavior: "auto" });
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const container = containerRef.current;

    if (!container) {
      return;
    }

    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [containerRef, enabled]);
}
