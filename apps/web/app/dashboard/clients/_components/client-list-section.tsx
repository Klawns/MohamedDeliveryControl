import { Client } from '@/types/rides';
import { ClientSearch } from './client-search';
import { ClientsListContainer } from './client-list';

interface ClientListSectionProps {
  clients: Client[];
  isLoading: boolean;
  isFetching?: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  totalCount: number;
  error?: unknown;
  retry?: () => void | Promise<unknown>;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
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
  totalCount,
  error,
  retry,
  onEdit,
  onDelete,
  onPin,
  onQuickRide,
  onViewHistory,
}: ClientListSectionProps) {
  return (
    <section className="flex min-h-0 flex-col gap-6 overflow-hidden">
      <div className="shrink-0">
        <ClientSearch value={search} onChange={onSearchChange} />
      </div>

      <div className="min-h-0 overflow-hidden">
        <ClientsListContainer
          clients={clients}
          isLoading={isLoading}
          isFetching={isFetching}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={onLoadMore}
          totalCount={totalCount}
          error={error}
          retry={retry}
          search={search}
          onClearSearch={() => onSearchChange('')}
          onEdit={onEdit}
          onDelete={onDelete}
          onPin={onPin}
          onQuickRide={onQuickRide}
          onViewHistory={onViewHistory}
        />
      </div>
    </section>
  );
}
