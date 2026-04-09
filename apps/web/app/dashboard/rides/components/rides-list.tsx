import { useMemo, useRef } from 'react';
import { Bike, SearchX } from 'lucide-react';
import { InfiniteScrollTrigger } from '@/components/dashboard/mobile-dashboard/components/infinite-scroll-trigger';
import { ScrollBoundaryContainer } from '@/components/ui/scroll-boundary-container';
import { parseApiError } from '@/lib/api-error';
import { PaymentStatus, RideViewModel } from '@/types/rides';
import { groupRidesByDate } from '../_lib/rides-list-groups';
import { RideCard } from './ride-card';
import { RideSkeleton } from './ride-skeleton';

interface RidesListContainerProps {
  rides: RideViewModel[];
  totalCount: number;
  isLoading: boolean;
  isFetching?: boolean;
  hasNextPage?: boolean;
  onLoadMore?: () => void;
  isFetchingNextPage?: boolean;
  error?: unknown;
  retry?: () => void | Promise<unknown>;
  onEdit: (ride: RideViewModel) => void;
  onDelete: (ride: RideViewModel) => void;
  onChangePaymentStatus: (ride: RideViewModel, status: PaymentStatus) => void | Promise<unknown>;
  isPaymentUpdating: (rideId: string) => boolean;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export function RidesListContainer({
  rides,
  totalCount,
  isLoading,
  isFetching,
  hasNextPage,
  onLoadMore,
  isFetchingNextPage,
  error,
  retry,
  onEdit,
  onDelete,
  onChangePaymentStatus,
  isPaymentUpdating,
  hasActiveFilters,
  onClearFilters,
}: RidesListContainerProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const groupedRides = useMemo(() => groupRidesByDate(rides), [rides]);
  const showSkeletons =
    (isLoading || (isFetching && rides.length === 0)) && !isFetchingNextPage;
  const resultsLabel =
    totalCount > rides.length
      ? `Mostrando ${rides.length} de ${totalCount} corridas`
      : `${totalCount} ${totalCount === 1 ? 'corrida' : 'corridas'}`;

  const renderContent = () => {
    if (showSkeletons) {
      return (
        <div className="flex flex-col gap-4">
          {[...Array(5)].map((_, index) => (
            <RideSkeleton key={index} />
          ))}
        </div>
      );
    }

    if (error && rides.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center gap-5 rounded-[1.75rem] border border-border-subtle bg-card-background/60 px-6 py-20 text-center">
          <div className="space-y-2">
            <h3 className="text-2xl font-display font-extrabold tracking-tight text-text-primary">
              Erro ao carregar corridas
            </h3>
            <p className="max-w-md text-sm text-text-secondary">
              {parseApiError(
                error,
                'Nao foi possivel carregar o historico agora.',
              )}
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

    if (rides.length === 0 && !isFetching) {
      return (
        <div className="flex flex-col items-center justify-center gap-5 rounded-[1.75rem] border border-dashed border-border-subtle bg-card-background/50 px-6 py-20 text-center">
          <div className="rounded-full bg-secondary/10 p-5 text-text-secondary/40">
            {hasActiveFilters ? <SearchX size={40} /> : <Bike size={40} />}
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-display font-extrabold tracking-tight text-text-primary">
              {hasActiveFilters ? 'Nenhuma corrida encontrada' : 'Nenhuma corrida registrada'}
            </h3>
            <p className="max-w-sm text-sm text-text-secondary">
              {hasActiveFilters
                ? 'Ajuste os filtros para ampliar a busca ou limpar o recorte atual.'
                : 'As novas corridas aparecerao aqui assim que forem registradas.'}
            </p>
          </div>
          {hasActiveFilters ? (
            <button
              onClick={onClearFilters}
              className="rounded-2xl border border-border-subtle px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-text-primary transition-colors hover:border-border hover:bg-hover-accent"
            >
              Limpar filtros
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
        className="max-h-[min(68dvh,56rem)] space-y-6 overflow-y-auto pr-1 scrollbar-hide sm:space-y-8"
      >
        {groupedRides.map((group) => (
          <section key={group.id} className="space-y-2.5 sm:space-y-3">
            <div className="sticky top-0 z-10 -mx-1 bg-background/90 px-1 py-1 backdrop-blur-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-text-secondary/75">
                {group.label}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:gap-4">
              {group.rides.map((ride) => (
                <RideCard
                  key={ride.id}
                  ride={ride}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onChangePaymentStatus={onChangePaymentStatus}
                  isPaymentUpdating={isPaymentUpdating(ride.id)}
                />
              ))}
            </div>
          </section>
        ))}

        {(hasNextPage || isFetchingNextPage || error) ? (
          <InfiniteScrollTrigger
            onIntersect={onLoadMore || (() => {})}
            isLoading={!!isFetchingNextPage}
            hasMore={!!hasNextPage}
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
            Lista de corridas
          </h2>
          <p className="text-sm text-text-secondary">
            Valor em destaque, status financeiro discreto e detalhes sob demanda.
          </p>
        </div>

        <div className="text-sm text-text-secondary">
          <span className="font-semibold text-text-primary">{resultsLabel}</span>
          {' / '}
          Ordenadas por data
        </div>
      </div>

      {renderContent()}
    </section>
  );
}
