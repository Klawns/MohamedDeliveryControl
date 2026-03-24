"use client";

import { useRidesFilters } from "../_hooks/use-rides-filters";
import { useRidesPagination } from "../_hooks/use-rides-pagination";
import { useRidesData } from "../_hooks/use-rides-data";
import { useRidesModals } from "../_hooks/use-rides-modals";
import { useMemo, useCallback } from "react";

/**
 * Hook principal (Facade) para o módulo de Corridas.
 * Refatorado para estabilidade de referências e performance.
 */
export function useRides() {
    const filters = useRidesFilters();
    const pageSize = 10;

    const data = useRidesData({
        filters: filters.filterState,
        pageSize
    });

    const modals = useRidesModals({
        onSuccess: async () => {
             await data.fetchRides();
        }
    });

    // Estabilização de Setters (useCallback)
    const setFiltersAndReset = useCallback(<T>(setter: (val: T) => void, val: T) => {
        setter(val);
    }, []);

    const stableSetters = useMemo(() => ({
        setSearch: (s: string) => setFiltersAndReset(filters.setSearch, s),
        setPaymentFilter: (p: string) => setFiltersAndReset(filters.setPaymentFilter, p),
        setClientFilter: (c: string) => setFiltersAndReset(filters.setClientFilter, c),
        setStartDate: (d: string) => setFiltersAndReset(filters.setStartDate, d),
        setEndDate: (d: string) => setFiltersAndReset(filters.setEndDate, d),
    }), [filters.setSearch, filters.setPaymentFilter, filters.setClientFilter, filters.setStartDate, filters.setEndDate, setFiltersAndReset]);

    const clearFiltersExtended = useCallback(() => {
        filters.clearFilters();
    }, [filters.clearFilters]);

    // Memoização do Retorno (Facade)
    return useMemo(() => ({
        // Estado de Dados
        rides: data.rides,
        clients: data.clients,
        frequentClients: data.frequentClients,
        isLoading: data.isLoading,
        isFetching: data.isFetching,
        isFetchingNextPage: data.isFetchingNextPage,
        hasNextPage: data.hasNextPage,
        fetchNextPage: data.fetchNextPage,
        isFrequentLoading: data.isFrequentLoading,
        totalCount: data.totalCount,
        ridesError: data.ridesError,
        
        // Filtros (Estado Memoizado)
        filterState: filters.filterState,
        isFiltersOpen: filters.isFiltersOpen,
        hasActiveFilters: filters.hasActiveFilters,
        setIsFiltersOpen: filters.setIsFiltersOpen,
        
        // Setters Estáveis
        ...stableSetters,
        clearFilters: clearFiltersExtended,
        
        // Paginação (compatibilidade mínima se necessário, mas agora é infinito)
        pageSize,
        
        // Modais e Estados Auxiliares
        ...modals,
        
        // Ações Exportadas
        fetchData: data.fetchRides,
        fetchFrequentClients: data.fetchFrequentClients,
        togglePaymentStatus: data.togglePaymentStatus,
    }), [data, filters, modals, stableSetters, clearFiltersExtended]);
}
