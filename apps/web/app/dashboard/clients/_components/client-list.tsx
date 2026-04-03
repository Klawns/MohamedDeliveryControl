"use client";

import { User } from "lucide-react";
import { HybridInfiniteList } from "@/components/ui/hybrid-infinite-list";
import { Client } from "@/types/rides";
import { ClientCard } from "./client-card";
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
    onDelete: (client: Client) => void;
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
    onDelete,
    onPin,
    onQuickRide,
    onViewHistory,
}: ClientsListContainerProps) {
    const showSkeletons =
        (isLoading || (isFetching && clients.length === 0)) && !isFetchingNextPage;

    const renderContent = () => {
        if (showSkeletons) {
            return (
                <div className="grid w-full grid-cols-1 gap-4 px-1 md:grid-cols-2 md:gap-8 md:px-2 xl:grid-cols-3">
                    {[...Array(9)].map((_, index) => (
                        <ClientSkeleton key={index} />
                    ))}
                </div>
            );
        }

        if (clients.length === 0 && !isFetching) {
            return (
                <div className="mx-4 flex flex-col items-center justify-center gap-4 rounded-[3rem] border border-border-subtle bg-secondary/5 py-24 shadow-inner">
                    <div className="rounded-full border border-border-subtle/50 bg-secondary/10 p-6 text-text-secondary/20">
                        <User size={56} opacity={0.3} />
                    </div>
                    <h3 className="text-xl font-display font-extrabold tracking-tight text-text-primary">
                        Nenhum cliente disponivel
                    </h3>
                    <p className="text-sm font-medium italic text-text-secondary opacity-60">
                        Seus registros aparecerao aqui conforme forem adicionados.
                    </p>
                </div>
            );
        }

        return (
            <HybridInfiniteList
                items={clients}
                renderItem={(client) => (
                    <ClientCard
                        key={client.id}
                        client={client}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onPin={onPin}
                        onQuickRide={onQuickRide}
                        onViewHistory={onViewHistory}
                    />
                )}
                estimateSize={220}
                hasMore={hasNextPage}
                onLoadMore={onLoadMore}
                isFetchingNextPage={isFetchingNextPage}
                listClassName="grid w-full grid-cols-1 gap-4 px-1 pb-20 md:grid-cols-2 md:gap-8 md:px-2 xl:grid-cols-3"
                className="w-full scrollbar-hide"
                maxHeight="min(68dvh, 56rem)"
                hideScrollbar={true}
                scrollBoundaryMode="handoff"
            />
        );
    };

    return (
        <section className="flex flex-col overflow-hidden rounded-[2rem] border border-border-subtle bg-card-background/20 p-2 shadow-inner">
            <div className="flex shrink-0 items-center justify-between px-3 py-2">
                <span className="text-[10px] font-display font-bold uppercase tracking-[0.25em] text-text-muted opacity-80">
                    {total} {total === 1 ? "cliente encontrado" : "clientes encontrados"}
                </span>
            </div>

            <div className="min-h-0">
                {renderContent()}
            </div>
        </section>
    );
}
