"use client";

import { RefObject } from "react";
import { useTouchScrollHandoff } from "./use-touch-scroll-handoff";
import { useWheelScrollHandoff } from "./use-wheel-scroll-handoff";

interface UseScrollBoundaryHandoffOptions {
  containerRef: RefObject<HTMLElement | null>;
  parentRef?: RefObject<HTMLElement | null>;
  enabled?: boolean;
}

export function useScrollBoundaryHandoff({
  containerRef,
  parentRef,
  enabled = true,
}: UseScrollBoundaryHandoffOptions) {
  useWheelScrollHandoff({ containerRef, parentRef, enabled });
  useTouchScrollHandoff({ containerRef, parentRef, enabled });
}
