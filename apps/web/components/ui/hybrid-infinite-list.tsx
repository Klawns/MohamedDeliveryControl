import React, { useRef } from 'react';
import { useHybridList } from '@/hooks/use-hybrid-list';
import { VirtualizedInfiniteList } from './virtualized-infinite-list';
import { cn } from '@/lib/utils';
import { InfiniteScrollTrigger } from '@/components/dashboard/mobile-dashboard/components/infinite-scroll-trigger';

interface HybridInfiniteListProps<T> {
    items: T[];
    renderItem: (item: T, index: number) => React.ReactNode;
    estimateSize: number;
    containerRef?: React.RefObject<HTMLDivElement | null>;
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
    error?: any;
    retry?: () => void;
    listClassName?: string;
}

/**
 * Componente que alterna entre renderização direta (.map) e virtualização.
 * Para listas pequenas, renderiza todos os itens diretamente para evitar delays e blank screen.
 * Para listas grandes, utiliza virtualização para performance.
 */
export function HybridInfiniteList<T extends { id: string | number }>({
    items,
    renderItem,
    estimateSize,
    containerRef: externalRef,
    hasMore,
    onLoadMore,
    isLoading,
    isFetching,
    isFetchingNextPage,
    className = "",
    gap = 0,
    threshold,
    enabled = true,
    maxHeight,
    hideScrollbar,
    error,
    retry,
    listClassName
}: HybridInfiniteListProps<T>) {
    const localRef = useRef<HTMLDivElement>(null);
    const containerRef = (externalRef || localRef) as React.RefObject<HTMLDivElement | null>;
    const { isVirtualizing } = useHybridList(items, { threshold, enabled });

    // Caso de Virtualização (Lista Grande)
    if (isVirtualizing) {
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
            />
        );
    }

    // Caso de Renderização Direta (Lista Pequena)
    const content = (
        <div 
            className={listClassName}
            style={!listClassName ? { 
                display: 'flex', 
                flexDirection: 'column', 
                gap: gap ? `${gap}px` : undefined 
            } : undefined}
        >
            {items.map((item, index) => (
                <React.Fragment key={item.id}>
                    {renderItem(item, index)}
                </React.Fragment>
            ))}

            {(hasMore || isFetchingNextPage || error) && (
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

    // Se tivermos um maxHeight ou se NÃO tivermos um ref externo, criamos o container
    if (maxHeight || !externalRef) {
        return (
            <div 
                ref={containerRef}
                className={cn(
                    "overflow-y-auto scroll-smooth w-full",
                    hideScrollbar && "scrollbar-hide",
                    !hideScrollbar && "custom-scrollbar",
                    className
                )}
                style={{ maxHeight }}
            >
                {content}
            </div>
        );
    }

    // Caso contrário, apenas renderizamos o conteúdo (o ref externo já está cuidando do scroll)
    return (
        <div className={className}>
            {content}
        </div>
    );
}
