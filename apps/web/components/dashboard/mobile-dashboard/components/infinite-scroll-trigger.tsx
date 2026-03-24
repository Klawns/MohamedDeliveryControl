"use client";

import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

interface InfiniteScrollTriggerProps {
    onIntersect: () => void;
    hasMore: boolean;
    isLoading: boolean;
    error?: any;
    retry?: () => void;
}

export function InfiniteScrollTrigger({
    onIntersect,
    hasMore,
    isLoading,
    error,
    retry,
    rootRef
}: InfiniteScrollTriggerProps & { rootRef?: React.RefObject<HTMLDivElement | null> }) {
    const observerTarget = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoading && !error) {
                    onIntersect();
                }
            },
            { 
                threshold: 0.1,
                root: rootRef?.current || null,
                rootMargin: '100px' // Margem para carregar um pouco antes de chegar ao fim
            }
        );

        const currentTarget = observerTarget.current;
        if (currentTarget) {
            observer.observe(currentTarget);
        }

        return () => {
            if (currentTarget) {
                observer.unobserve(currentTarget);
            }
        };
    }, [onIntersect, hasMore, isLoading, error, rootRef]);

    if (error) {
        return (
            <div className="flex flex-col items-center gap-2 p-4">
                <p className="text-sm text-destructive">Erro ao carregar mais itens</p>
                <button 
                    onClick={retry}
                    className="text-xs font-medium text-primary hover:underline"
                >
                    Tentar novamente
                </button>
            </div>
        );
    }

    if (!hasMore && !isLoading) return null;

    return (
        <div ref={observerTarget} className="flex justify-center p-6 h-20">
            {isLoading && <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />}
        </div>
    );
}
