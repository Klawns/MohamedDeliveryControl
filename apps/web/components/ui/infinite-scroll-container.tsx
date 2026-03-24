"use client";

import { ReactNode, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InfiniteScrollContainerProps {
    children: ReactNode;
    className?: string;
    maxHeight?: string;
    hideScrollbar?: boolean;
    style?: React.CSSProperties;
}

/**
 * Container para listagens com Infinite Scroll.
 * 
 * Resolve o problema de crescimento vertical ilimitado, mantendo a altura
 * fixa/máxima e permitindo scroll interno.
 */
export const InfiniteScrollContainer = forwardRef<HTMLDivElement, InfiniteScrollContainerProps>(
    ({ children, className, maxHeight = "60vh", hideScrollbar = false, style }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "overflow-y-auto px-1 -mx-1 scroll-smooth",
                    !hideScrollbar && "custom-scrollbar",
                    hideScrollbar && "scrollbar-hide",
                    className
                )}
                style={{ 
                    maxHeight,
                    WebkitOverflowScrolling: 'touch', // Suave no iOS
                    ...style
                }}
            >
                {children}
            </div>
        );
    }
);

InfiniteScrollContainer.displayName = "InfiniteScrollContainer";
