"use client";

import { useState, useCallback, useMemo } from "react";
import { RidesFilterState } from "@/types/rides";

export function useRidesFilters() {
    const [search, setSearch] = useState("");
    const [paymentFilter, setPaymentFilter] = useState<string>("all");
    const [clientFilter, setClientFilter] = useState<string>("all");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);

    const hasActiveFilters = 
        paymentFilter !== "all" || 
        clientFilter !== "all" || 
        startDate !== "" || 
        endDate !== "" || 
        search !== "";

    const clearFilters = useCallback(() => {
        setPaymentFilter("all");
        setClientFilter("all");
        setStartDate("");
        setEndDate("");
    }, []);

    const filterState = useMemo((): RidesFilterState => ({
        search,
        paymentFilter,
        clientFilter,
        startDate,
        endDate
    }), [search, paymentFilter, clientFilter, startDate, endDate]);

    return {
        filterState,
        setSearch,
        setPaymentFilter,
        setClientFilter,
        setStartDate,
        setEndDate,
        isFiltersOpen,
        setIsFiltersOpen,
        hasActiveFilters,
        clearFilters
    };
}
