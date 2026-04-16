import { Client } from '@/types/rides';
import { ClientSearch } from './client-search';
import { ClientsListContainer } from './client-list';

interface ClientListSectionProps {
  clients: Client[];
  isLoading: boolean;
  isFetching?: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onNewClient: () => void;
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
  selection: {
    isSelectionMode: boolean;
    selectedCount: number;
    totalVisible: number;
    isClientSelected: (clientId: string) => boolean;
    onEnterSelectionMode: (clientId?: string) => void;
    onExitSelectionMode: () => void;
    onToggleClientSelection: (clientId: string) => void;
    onToggleSelectAllVisible: (isSelected: boolean) => void;
    isAllVisibleSelected: boolean;
    isSelectionIndeterminate: boolean;
    onDeleteSelected: () => void;
    isDeletingSelected: boolean;
  };
}

export function ClientListSection({
  clients,
  isLoading,
  isFetching,
  search,
  onSearchChange,
  onNewClient,
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
  selection,
}: ClientListSectionProps) {
  return (
    <section className="flex min-h-0 flex-col gap-6 overflow-hidden">
      <div className="shrink-0">
        <ClientSearch
          value={search}
          onChange={onSearchChange}
          onNewClient={onNewClient}
        />
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
          selection={selection}
        />
      </div>
    </section>
  );
}
