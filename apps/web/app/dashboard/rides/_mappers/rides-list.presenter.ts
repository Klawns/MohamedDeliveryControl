import { parseApiError } from "@/lib/api-error";
import type { RideViewModel } from "@/types/rides";
import {
  groupRidesByDate,
  type RideDateGroup,
} from "../_lib/rides-list-groups";

export type RidesListContentState = "loading" | "error" | "empty" | "results";
export type RidesListEmptyStateVariant = "default" | "filtered";

export interface BuildRidesListPresenterParams {
  rides: RideViewModel[];
  totalCount: number;
  isLoading: boolean;
  isFetching: boolean;
  isFetchingNextPage?: boolean;
  error?: unknown;
  hasActiveFilters: boolean;
  now?: Date;
}

export interface RidesListPresentation {
  groupedRides: RideDateGroup[];
  resultsLabel: string;
  contentState: RidesListContentState;
  emptyStateVariant: RidesListEmptyStateVariant;
  emptyTitle: string;
  emptyDescription: string;
  errorMessage: string | null;
}

export function buildRidesListPresenter({
  rides,
  totalCount,
  isLoading,
  isFetching,
  isFetchingNextPage = false,
  error,
  hasActiveFilters,
  now,
}: BuildRidesListPresenterParams): RidesListPresentation {
  const groupedRides = groupRidesByDate(rides, now);
  const showLoadingState =
    (isLoading || (isFetching && rides.length === 0)) && !isFetchingNextPage;

  let contentState: RidesListContentState = "results";

  if (showLoadingState) {
    contentState = "loading";
  } else if (error && rides.length === 0) {
    contentState = "error";
  } else if (rides.length === 0 && !isFetching) {
    contentState = "empty";
  }

  return {
    groupedRides,
    resultsLabel:
      totalCount > rides.length
        ? `Mostrando ${rides.length} de ${totalCount} corridas`
        : `${totalCount} ${totalCount === 1 ? "corrida" : "corridas"}`,
    contentState,
    emptyStateVariant: hasActiveFilters ? "filtered" : "default",
    emptyTitle: hasActiveFilters
      ? "Nenhuma corrida encontrada"
      : "Nenhuma corrida registrada",
    emptyDescription: hasActiveFilters
      ? "Ajuste os filtros para ampliar a busca ou limpar o recorte atual."
      : "As novas corridas aparecerao aqui assim que forem registradas.",
    errorMessage:
      contentState === "error"
        ? parseApiError(error, "Nao foi possivel carregar o historico agora.")
        : null,
  };
}
