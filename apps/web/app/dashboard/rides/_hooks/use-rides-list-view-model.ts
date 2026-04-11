"use client";

import { useMemo } from "react";
import {
  buildRidesListPresenter,
  type BuildRidesListPresenterParams,
} from "../_mappers/rides-list.presenter";

export function useRidesListViewModel(params: BuildRidesListPresenterParams) {
  const {
    rides,
    totalCount,
    isLoading,
    isFetching,
    isFetchingNextPage,
    error,
    hasActiveFilters,
    now,
  } = params;

  return useMemo(
    () =>
      buildRidesListPresenter({
        rides,
        totalCount,
        isLoading,
        isFetching,
        isFetchingNextPage,
        error,
        hasActiveFilters,
        now,
      }),
    [
      error,
      hasActiveFilters,
      isFetching,
      isFetchingNextPage,
      isLoading,
      now,
      rides,
      totalCount,
    ],
  );
}
