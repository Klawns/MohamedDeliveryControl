'use client';

import { useRef } from 'react';
import { SearchX, Users } from 'lucide-react';
import { InfiniteScrollTrigger } from '@/components/dashboard/mobile-dashboard/components/infinite-scroll-trigger';
import { ScrollBoundaryContainer } from '@/components/ui/scroll-boundary-container';
import { parseApiError } from '@/lib/api-error';
import { Client } from '@/types/rides';
import { ClientCard } from './client-card';
import { ClientSkeleton } from './client-skeleton';

interface ClientsListContainerProps {
  clients: Client[];
  isLoading: boolean;
  isFetching?: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  totalCount: number;
  error?: unknown;
  retry?: () => void | Promise<unknown>;
  search: string;
  onClearSearch: () => void;
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
  totalCount,
  error,
  retry,
  search,
  onClearSearch,
  onEdit,
  onDelete,
  onPin,
  onQuickRide,
  onViewHistory,
}: ClientsListContainerProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasActiveSearch = search.trim().length > 0;
  const showSkeletons =
    (isLoading || (isFetching && clients.length === 0)) && !isFetchingNextPage;
  const resultsLabel =
    totalCount > clients.length
      ? `Mostrando ${clients.length} de ${totalCount} clientes`
      : `${totalCount} ${totalCount === 1 ? 'cliente' : 'clientes'}`;

  const renderContent = () => {
    if (showSkeletons) {
      return (
        <div className="flex flex-col gap-4">
          {[...Array(6)].map((_, index) => (
            <ClientSkeleton key={index} />
          ))}
        </div>
      );
    }

    if (error && clients.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center gap-5 rounded-[1.75rem] border border-border-subtle bg-card-background/60 px-6 py-20 text-center">
          <div className="space-y-2">
            <h3 className="text-2xl font-display font-extrabold tracking-tight text-text-primary">
              Erro ao carregar clientes
            </h3>
            <p className="max-w-md text-sm text-text-secondary">
              {parseApiError(error, 'Nao foi possivel carregar a lista agora.')}
            </p>
          </div>

          {retry ? (
            <button
              onClick={() => void retry()}
              className="rounded-2xl bg-button-primary px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-button-primary-foreground transition-colors hover:bg-button-primary-hover"
            >
              Tentar novamente
            </button>
          ) : null}
        </div>
      );
    }

    if (clients.length === 0 && !isFetching) {
      return (
        <div className="flex flex-col items-center justify-center gap-5 rounded-[1.75rem] border border-dashed border-border-subtle bg-card-background/50 px-6 py-20 text-center">
          <div className="rounded-full bg-secondary/10 p-5 text-text-secondary/40">
            {hasActiveSearch ? <SearchX size={40} /> : <Users size={40} />}
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-display font-extrabold tracking-tight text-text-primary">
              {hasActiveSearch ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
            </h3>
            <p className="max-w-sm text-sm text-text-secondary">
              {hasActiveSearch
                ? 'Ajuste a busca para ampliar o resultado atual.'
                : 'Os novos clientes aparecerao aqui assim que forem cadastrados.'}
            </p>
          </div>

          {hasActiveSearch ? (
            <button
              onClick={onClearSearch}
              className="rounded-2xl border border-border-subtle px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-text-primary transition-colors hover:border-border hover:bg-hover-accent"
            >
              Limpar busca
            </button>
          ) : null}
        </div>
      );
    }

    return (
      <ScrollBoundaryContainer
        containerRef={scrollContainerRef}
        handoff
        hideScrollbar
        className="max-h-[min(68dvh,56rem)] space-y-4 overflow-y-auto pr-1 scrollbar-hide"
      >
        <div className="flex flex-col gap-4">
          {clients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onEdit={onEdit}
              onDelete={onDelete}
              onPin={onPin}
              onQuickRide={onQuickRide}
              onViewHistory={onViewHistory}
            />
          ))}
        </div>

        {(hasNextPage || isFetchingNextPage || !!error) ? (
          <InfiniteScrollTrigger
            onIntersect={onLoadMore}
            isLoading={!!isFetchingNextPage}
            hasMore={hasNextPage}
            error={error}
            retry={typeof retry === 'function' ? () => void retry() : undefined}
            rootRef={scrollContainerRef}
          />
        ) : null}
      </ScrollBoundaryContainer>
    );
  };

  return (
    <section className="rounded-[2rem] border border-border-subtle bg-background/80 p-4 shadow-sm sm:p-5">
      <div className="mb-5 flex flex-col gap-2 border-b border-border-subtle/70 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-display font-bold tracking-tight text-text-primary">
            Lista de clientes
          </h2>
          <p className="text-sm text-text-secondary">
            Nome em destaque, contatos como apoio e acoes mais leves no rodape.
          </p>
        </div>

        <div className="text-sm text-text-secondary">
          <span className="font-semibold text-text-primary">{resultsLabel}</span>
          {' / '}
          Fixados primeiro, depois nome
        </div>
      </div>

      {renderContent()}
    </section>
  );
}
