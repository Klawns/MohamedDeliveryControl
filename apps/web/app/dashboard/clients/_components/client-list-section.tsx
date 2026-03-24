import { ClientSearch } from "./client-search";
import { ClientsListContainer } from "./client-list";
import { Client } from "@/types/rides";

interface ClientListSectionProps {
    clients: Client[];
    isLoading: boolean;
    isFetching?: boolean;
    search: string;
    onSearchChange: (value: string) => void;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    onLoadMore: () => void;
    total: number;
    onEdit: (client: Client) => void;
    onPin: (client: Client) => void;
    onQuickRide: (client: Client) => void;
    onViewHistory: (client: Client) => void;
}

export function ClientListSection({
    clients,
    isLoading,
    isFetching,
    search,
    onSearchChange,
    hasNextPage,
    isFetchingNextPage,
    onLoadMore,
    total,
    onEdit,
    onPin,
    onQuickRide,
    onViewHistory
}: ClientListSectionProps) {
    return (
        <>
            <ClientSearch value={search} onChange={onSearchChange} />

            <ClientsListContainer 
                clients={clients}
                isLoading={isLoading}
                isFetching={isFetching}
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                onLoadMore={onLoadMore}
                total={total}
                onEdit={onEdit}
                onPin={onPin}
                onQuickRide={onQuickRide}
                onViewHistory={onViewHistory}
            />
        </>
    );
}
