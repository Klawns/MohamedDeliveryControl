import { motion } from "framer-motion";
import { Bike, SearchX } from "lucide-react";
import { RideCard } from "./ride-card";
import { Ride } from "@/types/rides";
import { useRef } from "react";
import { InfiniteScrollContainer } from "@/components/ui/infinite-scroll-container";
import { RideSkeleton } from "./ride-skeleton";
import { HybridInfiniteList } from "@/components/ui/hybrid-infinite-list";

interface RidesListContainerProps {
    rides: Ride[];
    isLoading: boolean;
    isFetching?: boolean;
    hasNextPage?: boolean;
    onLoadMore?: () => void;
    isFetchingNextPage?: boolean;
    error?: any;
    retry?: () => void;
    onEdit: (ride: Ride) => void;
    onDelete: (ride: Ride) => void;
    onTogglePayment: (ride: Ride) => void;
    hasActiveFilters: boolean;
    onClearFilters: () => void;
}

export function RidesListContainer({
    rides,
    isLoading,
    isFetching,
    hasNextPage,
    onLoadMore,
    isFetchingNextPage,
    error,
    retry,
    onEdit,
    onDelete,
    onTogglePayment,
    hasActiveFilters,
    onClearFilters
}: RidesListContainerProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const showSkeletons = (isLoading || (isFetching && rides.length === 0)) && !isFetchingNextPage;

    if (showSkeletons) {
        return (
            <div className="space-y-6">
                {[...Array(5)].map((_, i) => (
                    <RideSkeleton key={i} />
                ))}
            </div>
        );
    }

    if (rides.length === 0 && !isFetching) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-6 bg-secondary/5 rounded-[3.5rem] border border-border-subtle shadow-inner">
                <div className="p-8 bg-secondary/10 rounded-full text-text-secondary/20 shadow-sm border border-border-subtle/50">
                    {hasActiveFilters ? <SearchX size={56} opacity={0.3} /> : <Bike size={56} opacity={0.3} />}
                </div>
                <div className="text-center space-y-2">
                    <h3 className="text-2xl font-display font-extrabold text-text-primary tracking-tight">
                        {hasActiveFilters ? "Nada encontrado" : "Tudo limpo por aqui"}
                    </h3>
                    <p className="text-text-secondary text-sm font-medium opacity-70 max-w-xs mx-auto">
                        {hasActiveFilters
                            ? "Não encontramos resultados para seus filtros atuais."
                            : "Você ainda não tem corridas registradas no período selecionado."}
                    </p>
                </div>
                {hasActiveFilters && (
                    <button
                        onClick={onClearFilters}
                        className="bg-button-primary hover:bg-button-primary-hover text-button-primary-foreground px-10 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-button-shadow active:scale-95 mt-4 uppercase tracking-widest text-xs"
                    >
                        Limpar Filtros e Ver Todos
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-2 mb-2">
                <div className="flex items-center gap-2">
                    <h2 className="text-[10px] font-display font-bold text-text-muted uppercase tracking-[0.25em] opacity-80">Atividades Recentes</h2>
                </div>
            </div>

            <InfiniteScrollContainer 
                ref={scrollContainerRef}
                maxHeight="calc(100vh - 220px)"
                hideScrollbar={true}
                className="w-full"
            >
                <HybridInfiniteList
                    items={rides.filter(Boolean)}
                    renderItem={(ride, index) => (
                        <RideCard
                            key={(ride as Ride).id}
                            ride={ride as Ride}
                            index={index}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onTogglePayment={onTogglePayment}
                        />
                    )}
                    estimateSize={140}
                    containerRef={scrollContainerRef}
                    hasMore={!!hasNextPage}
                    onLoadMore={onLoadMore || (() => {})}
                    isFetchingNextPage={isFetchingNextPage}
                    className="flex flex-col gap-6 px-2 pb-20"
                    gap={24}
                />
            </InfiniteScrollContainer>
        </div>
    );
}
