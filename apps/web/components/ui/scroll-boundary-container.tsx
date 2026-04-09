"use client";

import { ReactNode, RefObject, useRef } from "react";
import { useScrollBoundaryHandoff } from "@/hooks/use-scroll-boundary-handoff";
import { cn } from "@/lib/utils";

interface ScrollBoundaryContainerProps {
  children: ReactNode;
  className?: string;
  containerRef?: RefObject<HTMLDivElement | null>;
  scrollParentRef?: RefObject<HTMLElement | null>;
  maxHeight?: string;
  hideScrollbar?: boolean;
  style?: React.CSSProperties;
  qaId?: string;
  handoff?: boolean;
}

export function ScrollBoundaryContainer({
  children,
  className,
  containerRef: externalRef,
  scrollParentRef,
  maxHeight,
  hideScrollbar = false,
  style,
  qaId,
  handoff = false,
}: ScrollBoundaryContainerProps) {
  const localRef = useRef<HTMLDivElement>(null);
  const containerRef =
    externalRef ?? (localRef as RefObject<HTMLDivElement | null>);

  useScrollBoundaryHandoff({
    containerRef: containerRef as RefObject<HTMLElement | null>,
    parentRef: scrollParentRef,
    enabled: handoff,
  });

  return (
    <div
      ref={containerRef}
      className={cn(
        "min-h-0 overflow-y-auto",
        hideScrollbar ? "scrollbar-hide" : "custom-scrollbar",
        className,
      )}
      data-scroll-container="true"
      data-scroll-boundary-mode={handoff ? "handoff" : "contain"}
      data-qa={qaId}
      style={{
        ...(maxHeight ? { maxHeight } : null),
        WebkitOverflowScrolling: "touch",
        overscrollBehaviorY: handoff ? "auto" : "contain",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
