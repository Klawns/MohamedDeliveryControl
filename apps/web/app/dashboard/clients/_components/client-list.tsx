'use client';

import { useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SearchX, Users } from 'lucide-react';
import { DASHBOARD_MOBILE_NAV_OFFSET } from '@/app/dashboard/_lib/dashboard-navigation';
import { SelectionActionBarMobile } from '@/components/ride-selection/selection-action-bar-mobile';
import { SelectionCheckbox } from '@/components/ride-selection/selection-checkbox';
import { SelectionContextBar } from '@/components/ride-selection/selection-context-bar';
import { InfiniteScrollTrigger } from '@/components/dashboard/mobile-dashboard/components/infinite-scroll-trigger';
import { ScrollBoundaryContainer } from '@/components/ui/scroll-boundary-container';
import { useIsMobile } from '@/hooks/use-mobile';
import { parseApiError } from '@/lib/api-error';
import { Client } from '@/types/rides';
import { ClientCard } from './client-card';
import { ClientSkeleton } from './client-skeleton';

const SELECTION_TRANSITION = {
  duration: 0.15,
  ease: 'easeOut',
} as const;

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
  selection,
}: ClientsListContainerProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const mobileSelectionBarBottom = `calc(${DASHBOARD_MOBILE_NAV_OFFSET} + 0.75rem)`;
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
              selection={{
                isSelectionMode: selection.isSelectionMode,
                isSelected: selection.isClientSelected(client.id),
                onEnterSelectionMode: selection.onEnterSelectionMode,
                onToggleSelection: selection.onToggleClientSelection,
                selectionDisabled: selection.isDeletingSelected,
                canEnterSelectionWithLongPress: isMobile,
              }}
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
    <section
      className="rounded-[2rem] border border-border-subtle bg-background/80 p-4 shadow-sm sm:p-5"
      style={{
        paddingBottom:
          selection.isSelectionMode && isMobile
            ? `calc(${mobileSelectionBarBottom} + 4.75rem)`
            : undefined,
      }}
    >
      <motion.div layout transition={SELECTION_TRANSITION}>
        <AnimatePresence initial={false}>
          {selection.isSelectionMode ? (
            <motion.div
              key="selection-header"
              layout
              className="mb-5"
              initial={{ opacity: 0, y: -3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              transition={SELECTION_TRANSITION}
            >
              <SelectionContextBar
                selectedCount={selection.selectedCount}
                totalVisible={selection.totalVisible}
                onCancel={selection.onExitSelectionMode}
                onToggleSelectAll={() =>
                  selection.onToggleSelectAllVisible(!selection.isAllVisibleSelected)
                }
                isAllVisibleSelected={selection.isAllVisibleSelected}
                onDeleteSelected={selection.onDeleteSelected}
                isDeleting={selection.isDeletingSelected}
                hideInlineActions={isMobile}
                selectionLabel={
                  selection.selectedCount === 1
                    ? '1 cliente selecionado'
                    : `${selection.selectedCount} clientes selecionados`
                }
                summaryLabel={
                  selection.selectedCount > 0
                    ? `${selection.selectedCount} de ${selection.totalVisible} visiveis`
                    : `${selection.totalVisible} clientes carregados`
                }
              />
            </motion.div>
          ) : (
            <motion.div
              key="default-header"
              layout
              className="mb-5 flex flex-col gap-2 border-b border-border-subtle/70 pb-4 sm:flex-row sm:items-end sm:justify-between"
              initial={{ opacity: 0, y: -3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              transition={SELECTION_TRANSITION}
            >
              <div className="space-y-1">
                <h2 className="text-lg font-display font-bold tracking-tight text-text-primary">
                  Lista de clientes
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
                <span>
                  <span className="font-semibold text-text-primary">{resultsLabel}</span>
                  {' / '}
                  Fixados primeiro, depois nome
                </span>
                {clients.length > 0 ? (
                  <motion.button
                    type="button"
                    layout
                    onClick={() => selection.onEnterSelectionMode()}
                    className="inline-flex items-center rounded-xl border border-border-subtle bg-secondary/10 px-3 py-2 text-xs font-semibold text-text-secondary transition-all hover:bg-secondary/15 hover:text-text-primary"
                    whileTap={{ scale: 0.98 }}
                  >
                    Selecionar
                  </motion.button>
                ) : null}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {selection.isSelectionMode && !isMobile && clients.length > 0 ? (
            <motion.div
              key="selection-desktop-actions"
              layout
              className="mb-5 overflow-hidden"
              initial={{ opacity: 0, y: -3, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -3, height: 0 }}
              transition={SELECTION_TRANSITION}
            >
              <div className="rounded-[1.5rem] border border-border-subtle bg-card-background/40 p-4">
                <label className="flex items-center gap-3 text-sm font-semibold text-text-primary">
                  <SelectionCheckbox
                    checked={
                      selection.isAllVisibleSelected
                        ? true
                        : selection.isSelectionIndeterminate
                          ? 'indeterminate'
                          : false
                    }
                    onToggle={() =>
                      selection.onToggleSelectAllVisible(!selection.isAllVisibleSelected)
                    }
                    ariaLabel="Selecionar todos os clientes visiveis"
                    disabled={selection.isDeletingSelected}
                  />
                  <span>
                    {selection.isAllVisibleSelected
                      ? 'Desmarcar todos'
                      : 'Selecionar todos'}
                  </span>
                </label>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>

      {renderContent()}

      <AnimatePresence initial={false}>
        {selection.isSelectionMode && isMobile ? (
          <motion.div
            key="selection-mobile-actions"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={SELECTION_TRANSITION}
          >
            <SelectionActionBarMobile
              className="fixed inset-x-4 z-50 rounded-[1.5rem] border border-border-subtle bg-background/98 p-3 shadow-[0_-14px_34px_rgba(15,23,42,0.16)] backdrop-blur-xl"
              style={{ bottom: mobileSelectionBarBottom }}
              isAllVisibleSelected={selection.isAllVisibleSelected}
              hasSelection={selection.selectedCount > 0}
              isDeleting={selection.isDeletingSelected}
              onToggleSelectAll={() =>
                selection.onToggleSelectAllVisible(!selection.isAllVisibleSelected)
              }
              onDeleteSelected={selection.onDeleteSelected}
              onCancel={selection.onExitSelectionMode}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
