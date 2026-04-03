"use client";

import { ReactNode, RefObject } from "react";
import { HybridInfiniteList } from "./hybrid-infinite-list";

type ScrollBoundaryMode = "contain" | "handoff";

interface DashboardCompactRidesContainerProps<T extends { id: string | number }> {
    items: T[];
    renderItem: (item: T, index: number) => ReactNode;
    containerRef?: RefObject<HTMLElement | null>;
    maxHeight?: string;
    gap?: number;
    isLoading?: boolean;
    hasMore?: boolean;
    onLoadMore?: () => void;
    isFetchingNextPage?: boolean;
    error?: any;
    retry?: () => void;
    scrollBoundaryMode?: ScrollBoundaryMode;
}

export function DashboardCompactRidesContainer<T extends { id: string | number }>({
    items,
    renderItem,
    containerRef,
    maxHeight = "50vh",
    gap = 12,
    isLoading,
    hasMore,
    onLoadMore,
    isFetchingNextPage,
    error,
    retry,
    scrollBoundaryMode = "contain",
}: DashboardCompactRidesContainerProps<T>) {
    return (
        <HybridInfiniteList<T>
            items={items}
            renderItem={renderItem}
            estimateSize={90}
            containerRef={containerRef}
            hasMore={!!hasMore}
            onLoadMore={onLoadMore || (() => {})}
            isLoading={isLoading}
            isFetchingNextPage={isFetchingNextPage}
            error={error}
            retry={retry}
            maxHeight={containerRef ? undefined : maxHeight}
            gap={gap}
            hideScrollbar={true}
            className="w-full h-full pr-0.5"
            scrollBoundaryMode={scrollBoundaryMode}
        />
    );
}
