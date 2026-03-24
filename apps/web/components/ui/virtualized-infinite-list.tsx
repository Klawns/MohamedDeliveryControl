"use client";

import React from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { InfiniteScrollTrigger } from "@/components/dashboard/mobile-dashboard/components/infinite-scroll-trigger";

interface VirtualizedInfiniteListProps<T> {
    items: T[];
    renderItem: (item: T, index: number) => React.ReactNode;
    estimateSize: number;
    hasMore: boolean;
    isLoading: boolean;
    onLoadMore: () => void;
    error?: any;
    retry?: () => void;
    containerRef: React.RefObject<HTMLDivElement | null>;
    className?: string;
    gap?: number;
    overscan?: number;
}

export function VirtualizedInfiniteList<T>({
    items,
    renderItem,
    estimateSize,
    hasMore,
    isLoading,
    onLoadMore,
    error,
    retry,
    containerRef,
    className,
    gap = 8,
    overscan = 12
}: VirtualizedInfiniteListProps<T>) {
    const count = items.length;
    const prevCountRef = React.useRef(count);

    const rowVirtualizer = useVirtualizer({
        count,
        getScrollElement: () => containerRef.current,
        estimateSize: () => estimateSize + gap,
        overscan,
    });

    // Sincronização explícita para evitar delays em mudanças de dados/paginação
    React.useLayoutEffect(() => {
        if (count !== prevCountRef.current) {
            rowVirtualizer.measure();
            prevCountRef.current = count;
        }
    }, [count, rowVirtualizer]);

    const virtualItems = rowVirtualizer.getVirtualItems();

    return (
        <div className={className}>
            <div
                style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                }}
            >
                {virtualItems.map((virtualRow) => (
                    <div
                        key={virtualRow.key}
                        data-index={virtualRow.index}
                        ref={rowVirtualizer.measureElement}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            transform: `translateY(${virtualRow.start}px)`,
                            paddingBottom: `${gap}px`,
                        }}
                    >
                        {renderItem(items[virtualRow.index], virtualRow.index)}
                    </div>
                ))}
            </div>

            <InfiniteScrollTrigger
                hasMore={hasMore}
                isLoading={isLoading}
                onIntersect={onLoadMore}
                error={error}
                retry={retry}
                rootRef={containerRef}
            />
        </div>
    );
}
