"use client";

import { useRef } from "react";
import { User } from "lucide-react";
import { Client } from "@/types/rides";
import { ClientCard } from "./client-card";
import { InfiniteScrollContainer } from "@/components/ui/infinite-scroll-container";
import { HybridInfiniteList } from "@/components/ui/hybrid-infinite-list";
import { ClientSkeleton } from "./client-skeleton";

interface ClientsListContainerProps {
    clients: Client[];
    isLoading: boolean;
    isFetching?: boolean;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    onLoadMore: () => void;
    total: number;
    onEdit: (client: Client) => void;
    onPin: (client: Client) => void;
    onQuickRide: (client: Client) => void;
    onViewHistory: (client: Client) => void;
}

export function ClientsListContainer({
    clients,
    isLoading,
    isFetching,
    hasNextPage,
    isFetchingNextPage,
    onLoadMore,
    total,
    onEdit,
    onPin,
    onQuickRide,
    onViewHistory
}: ClientsListContainerProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const showSkeletons = (isLoading || (isFetching && clients.length === 0)) && !isFetchingNextPage;

    if (showSkeletons) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full px-2">
                {[...Array(9)].map((_, i) => (
                    <ClientSkeleton key={i} />
                ))}
            </div>
        );
    }

    if (clients.length === 0 && !isFetching) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4 bg-secondary/5 rounded-[3rem] border border-border-subtle shadow-inner mx-4">
                <div className="p-6 bg-secondary/10 rounded-full text-text-secondary/20 border border-border-subtle/50">
                    <User size={56} opacity={0.3} />
                </div>
                <h3 className="text-xl font-display font-extrabold text-text-primary tracking-tight">Nenhum cliente disponível</h3>
                <p className="text-text-secondary text-sm font-medium italic opacity-60">Seus registros aparecerão aqui conforme forem adicionados.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-2 px-1">
                <span className="text-[10px] font-display font-bold text-text-muted uppercase tracking-[0.25em] opacity-80">
                    {total} {total === 1 ? "cliente encontrado" : "clientes encontrados"}
                </span>
            </div>
            
            <InfiniteScrollContainer 
                ref={scrollContainerRef}
                maxHeight="calc(100vh - 220px)"
                hideScrollbar={true}
                className="w-full"
            >
                <HybridInfiniteList
                    items={clients}
                    renderItem={(client) => (
                        <ClientCard
                            key={(client as Client).id}
                            client={client as Client}
                            onEdit={onEdit}
                            onPin={onPin}
                            onQuickRide={onQuickRide}
                            onViewHistory={onViewHistory}
                        />
                    )}
                    estimateSize={220}
                    containerRef={scrollContainerRef}
                    hasMore={hasNextPage}
                    onLoadMore={onLoadMore}
                    isFetchingNextPage={isFetchingNextPage}
                    listClassName="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full px-2"
                    className="pb-20"
                />
            </InfiniteScrollContainer>
        </div>
    );
}
