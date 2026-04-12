"use client";

import { motion } from "framer-motion";
import { Plus, Star, Users } from "lucide-react";
import { RefObject, useMemo } from "react";
import { DashboardClientGridContainer } from "@/components/ui/dashboard-client-grid-container";
import { cn } from "@/lib/utils";
import { Client } from "@/types/rides";
import type {
    ClientCreationDialogState,
    ClientSelectionDirectory,
} from "../hooks/use-client-selection";
import { ClientGridSkeleton } from "./client-grid-skeleton";
import { CreateClientDialog } from "./create-client-dialog";
import { SelectionSummaryCard } from "./selection-summary-card";

type ClientGridItem = Client | { kind: "create" };

interface ClientGridProps {
    directory: ClientSelectionDirectory;
    selectedClient: Client | null;
    onSelect: (client: Client | null) => void;
    creationDialog: ClientCreationDialogState;
    scrollRootRef?: RefObject<HTMLElement | null>;
}

function isCreateButton(item: ClientGridItem): item is { kind: "create" } {
    return "kind" in item;
}

export function ClientGrid({
    directory,
    selectedClient,
    onSelect,
    creationDialog,
    scrollRootRef,
}: ClientGridProps) {
    const gridItems = useMemo<ClientGridItem[]>(
        () => [...directory.clients.filter(Boolean), { kind: "create" }],
        [directory.clients],
    );

    return (
        <section
            className={cn(
                "flex flex-col overflow-hidden rounded-3xl border border-border-subtle bg-card-background p-4 shadow-sm transition-all duration-300",
                selectedClient ? "min-h-[100px]" : "min-h-[300px]",
            )}
        >
            <div className="mb-4 flex flex-shrink-0 items-center justify-between px-2">
                <h2 className="flex items-center gap-2 text-lg font-display font-extrabold text-text-primary">
                    <Users size={18} className="text-primary" />
                    {selectedClient ? "Cliente" : "Selecione o Cliente"}
                </h2>
            </div>

            {!selectedClient ? (
                <div className="flex flex-1 flex-col overflow-hidden">
                    {directory.isLoading && directory.clients.length === 0 ? (
                        <ClientGridSkeleton />
                    ) : (
                        <DashboardClientGridContainer
                            items={gridItems}
                            containerRef={scrollRootRef}
                            maxHeight="15.75rem"
                            gap={12}
                            hasMore={directory.hasMore}
                            isLoading={directory.isLoading || directory.isFetchingNextPage}
                            onLoadMore={directory.loadMore}
                            error={directory.error}
                            retry={directory.retry}
                            renderItem={(row) => (
                                <div className="grid w-full grid-cols-3 gap-3">
                                    {(row as ClientGridItem[]).map((item) =>
                                        renderGridItem({
                                            item,
                                            creationDialog,
                                            onSelect,
                                            selectedClientId: null,
                                        }),
                                    )}
                                </div>
                            )}
                        />
                    )}
                </div>
            ) : (
                <SelectionSummaryCard
                    title={selectedClient.name || "Sem nome"}
                    description="Cliente selecionado"
                    icon={Users}
                    onClick={() => onSelect(null)}
                    ariaLabel={`Trocar cliente ${selectedClient.name || "selecionado"}`}
                />
            )}

            <CreateClientDialog dialog={creationDialog} />
        </section>
    );
}

interface ClientCardProps {
    client: Client;
    isSelected: boolean;
    onSelect: (client: Client) => void;
}

function ClientCard({ client, isSelected, onSelect }: ClientCardProps) {
    return (
        <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(client)}
            className={cn(
                "group relative flex min-h-[70px] flex-col items-center justify-center overflow-hidden rounded-2xl p-2 text-center shadow-sm transition-all",
                isSelected
                    ? "border-primary/50 bg-primary/20 ring-1 ring-primary/20 shadow-primary/10"
                    : "border border-border-subtle bg-card-background active:bg-hover-accent",
            )}
        >
            {client.isPinned ? (
                <div className="absolute right-2 top-2 animate-pulse text-yellow-400 drop-shadow-md">
                    <Star size={10} className="fill-yellow-400" />
                </div>
            ) : null}

            <span
                className={cn(
                    "line-clamp-2 w-full break-words px-1 text-center text-[13px] font-display font-extrabold leading-tight tracking-tight transition-colors",
                    isSelected
                        ? "text-primary"
                        : "text-text-primary group-active:text-primary",
                )}
            >
                {client.name || "Sem nome"}
            </span>
        </motion.button>
    );
}

interface RenderGridItemProps {
    item: ClientGridItem;
    selectedClientId: string | null;
    onSelect: (client: Client) => void;
    creationDialog: ClientCreationDialogState;
}

function renderGridItem({
    item,
    selectedClientId,
    onSelect,
    creationDialog,
}: RenderGridItemProps) {
    if (isCreateButton(item)) {
        return (
            <button
                key="new-button"
                onClick={creationDialog.open}
                className="min-h-[70px] rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-2 shadow-sm transition-all active:scale-95 active:bg-primary/10"
            >
                <div className="group flex flex-col items-center justify-center">
                    <div className="mb-1 flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-primary/40 text-primary transition-transform group-hover:scale-110">
                        <Plus size={10} />
                    </div>
                    <span className="text-[9px] font-display font-bold uppercase tracking-widest text-primary">
                        Novo
                    </span>
                </div>
            </button>
        );
    }

    return (
        <ClientCard
            key={item.id}
            client={item}
            isSelected={selectedClientId === item.id}
            onSelect={onSelect}
        />
    );
}
