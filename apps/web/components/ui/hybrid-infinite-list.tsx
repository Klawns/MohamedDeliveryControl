import React, { useRef } from "react";
import { InfiniteScrollTrigger } from "@/components/dashboard/mobile-dashboard/components/infinite-scroll-trigger";
import { useHybridList } from "@/hooks/use-hybrid-list";
import { cn } from "@/lib/utils";
import { VirtualizedInfiniteList } from "./virtualized-infinite-list";

interface HybridInfiniteListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  estimateSize: number;
  containerRef?: React.RefObject<HTMLElement | null>;
  hasMore: boolean;
  onLoadMore: () => void;
  isLoading?: boolean;
  isFetching?: boolean;
  isFetchingNextPage?: boolean;
  className?: string;
  gap?: number;
  threshold?: number;
  enabled?: boolean;
  maxHeight?: string;
  hideScrollbar?: boolean;
  error?: unknown;
  retry?: () => void;
  listClassName?: string;
}

/**
 * Grids tendem a quebrar quando passam pela virtualizacao linear atual.
 * Nesses casos mantemos o infinite scroll sem virtualizacao ate termos um
 * renderer especifico para grid.
 */
export function HybridInfiniteList<T extends { id: string | number }>({
  items,
  renderItem,
  estimateSize,
  containerRef: externalRef,
  hasMore,
  onLoadMore,
  isLoading,
  isFetchingNextPage,
  className = "",
  gap = 0,
  threshold,
  enabled = false,
  maxHeight,
  hideScrollbar,
  error,
  retry,
  listClassName,
}: HybridInfiniteListProps<T>) {
  const localRef = useRef<HTMLDivElement>(null);
  const containerRef = (externalRef ||
    localRef) as React.RefObject<HTMLElement | null>;
  const { isVirtualizing } = useHybridList(items, { threshold, enabled });
  const shouldUseVirtualization = isVirtualizing && !listClassName;

  if (shouldUseVirtualization) {
    return (
      <VirtualizedInfiniteList
        items={items}
        renderItem={renderItem}
        estimateSize={estimateSize}
        containerRef={containerRef}
        hasMore={hasMore}
        onLoadMore={onLoadMore}
        isLoading={!!isFetchingNextPage}
        className={className}
        gap={gap}
        error={error}
        retry={retry}
      />
    );
  }

  const content = (
    <div
      className={listClassName}
      style={
        !listClassName
          ? {
              display: "flex",
              flexDirection: "column",
              gap: gap ? `${gap}px` : undefined,
            }
          : undefined
      }
    >
      {items.map((item, index) => (
        <React.Fragment key={item.id}>{renderItem(item, index)}</React.Fragment>
      ))}

      {(hasMore || isFetchingNextPage || !!error) && (
        <InfiniteScrollTrigger
          onIntersect={onLoadMore}
          isLoading={!!isFetchingNextPage || !!isLoading}
          hasMore={hasMore}
          error={error}
          retry={retry}
          rootRef={containerRef}
        />
      )}
    </div>
  );

  if (maxHeight || !externalRef) {
    return (
      <div
        ref={containerRef as React.RefObject<HTMLDivElement | null>}
        className={cn(
          "min-h-0 w-full overflow-y-auto overscroll-contain scroll-smooth",
          hideScrollbar && "scrollbar-hide",
          !hideScrollbar && "custom-scrollbar",
          className,
        )}
        style={{ maxHeight }}
      >
        {content}
      </div>
    );
  }

  return <div className={className}>{content}</div>;
}
