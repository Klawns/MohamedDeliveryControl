import { ReactNode, useMemo } from "react";
import { InfiniteScrollContainer } from "./infinite-scroll-container";
import { InfiniteScrollTrigger } from "@/components/dashboard/mobile-dashboard/components/infinite-scroll-trigger";

interface DashboardClientGridContainerProps<T> {
    items: T[];
    renderItem: (row: T[], rowIndex: number) => ReactNode;
    maxHeight?: string;
    gap?: number;
    isLoading?: boolean;
    hasMore?: boolean;
    onLoadMore?: () => void;
    error?: any;
    retry?: () => void;
}

export function DashboardClientGridContainer<T>({
    items,
    renderItem,
    maxHeight = "50vh",
    gap = 16,
    isLoading,
    hasMore,
    onLoadMore,
    error,
    retry
}: DashboardClientGridContainerProps<T>) {
    // Group items into rows of 3 for the 3x3 grid
    const rows = useMemo(() => {
        const r: T[][] = [];
        for (let i = 0; i < items.length; i += 3) {
            r.push(items.slice(i, i + 3));
        }
        return r;
    }, [items]);

    return (
        <InfiniteScrollContainer 
            maxHeight={maxHeight}
            hideScrollbar={true}
            className="w-full py-2"
        >
            <div 
                className="flex flex-col w-full pb-4"
                style={{ gap: `${gap}px` }}
            >
                {rows.map((row, index) => (
                    <div key={index} className="w-full">
                        {renderItem(row, index)}
                    </div>
                ))}
            </div>

            <InfiniteScrollTrigger 
                onIntersect={onLoadMore || (() => {})}
                isLoading={!!isLoading}
                hasMore={!!hasMore}
                error={error}
                retry={retry}
            />
        </InfiniteScrollContainer>
    );
}
