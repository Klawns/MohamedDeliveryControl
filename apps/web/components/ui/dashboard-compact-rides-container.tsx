"use client";

import { ReactNode } from "react";
import { HybridInfiniteList } from "./hybrid-infinite-list";

interface DashboardCompactRidesContainerProps<T extends { id: string | number }> {
    items: T[];
    renderItem: (item: T, index: number) => ReactNode;
    maxHeight?: string;
    gap?: number;
    isLoading?: boolean;
    hasMore?: boolean;
    onLoadMore?: () => void;
    isFetchingNextPage?: boolean;
    error?: any;
    retry?: () => void;
}

export function DashboardCompactRidesContainer<T extends { id: string | number }>({
    items,
    renderItem,
    maxHeight = "50vh",
    gap = 12,
    isLoading,
    hasMore,
    onLoadMore,
    isFetchingNextPage,
    error,
    retry
}: DashboardCompactRidesContainerProps<T>) {
    return (
        <HybridInfiniteList<T>
            items={items}
            renderItem={renderItem}
            estimateSize={90}
            hasMore={!!hasMore}
            onLoadMore={onLoadMore || (() => {})}
            isLoading={isLoading}
            isFetchingNextPage={isFetchingNextPage}
            error={error}
            retry={retry}
            maxHeight={maxHeight}
            gap={gap}
            hideScrollbar={true}
            className="w-full h-full pr-0.5"
        />
    );
}
