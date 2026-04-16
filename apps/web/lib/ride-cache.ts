import { type InfiniteData, type QueryClient } from '@tanstack/react-query';
import { rideKeys } from '@/lib/query-keys';
import { type ApiEnvelope } from '@/services/api';
import { type CursorMeta, type RideViewModel } from '@/types/rides';

type RideListEnvelope = ApiEnvelope<RideViewModel[], CursorMeta>;
type RideInfiniteData = InfiniteData<RideListEnvelope, string | undefined>;
const EMPTY_RIDE_META = {
  hasNextPage: false,
  nextCursor: undefined,
  total: 0,
} satisfies CursorMeta & { total: number };

interface RideFilters {
  search?: unknown;
  paymentStatus?: unknown;
  clientId?: unknown;
  startDate?: unknown;
  endDate?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object';
}

function isRideInfiniteData(value: unknown): value is RideInfiniteData {
  return (
    isRecord(value) &&
    Array.isArray(value.pages) &&
    Array.isArray(value.pageParams)
  );
}

function isRideListEnvelope(value: unknown): value is RideListEnvelope {
  return (
    isRecord(value) &&
    Array.isArray(value.data) &&
    isRecord(value.meta)
  );
}

function isRide(value: unknown): value is RideViewModel {
  return isRecord(value) && typeof value.id === 'string';
}

function compareRides(left: RideViewModel, right: RideViewModel) {
  const rideDateComparison = (right.rideDate || '').localeCompare(left.rideDate || '');

  if (rideDateComparison !== 0) {
    return rideDateComparison;
  }

  const createdAtComparison = (right.createdAt || '').localeCompare(left.createdAt || '');

  if (createdAtComparison !== 0) {
    return createdAtComparison;
  }

  return right.id.localeCompare(left.id);
}

function removeRide(rides: RideViewModel[], rideId: string) {
  return rides.filter((ride) => ride.id !== rideId);
}

function removeRideIds(rides: RideViewModel[], rideIds: Set<string>) {
  return rides.filter((ride) => !rideIds.has(ride.id));
}

function removeRidesByClient(rides: RideViewModel[], clientId: string) {
  return rides.filter((ride) => getRideClientId(ride) !== clientId);
}

function upsertSortedRides(rides: RideViewModel[], ride: RideViewModel) {
  return Array.from(
    new Map([...rides, ride].map((item) => [item.id, item])).values(),
  ).sort(compareRides);
}

function getRideClientId(ride: RideViewModel) {
  return ride.clientId || '';
}

function getFiltersFromQueryKey(queryKey: readonly unknown[]) {
  const filtersEntry = queryKey.find(
    (entry) => isRecord(entry) && isRecord(entry.filters),
  ) as { filters?: RideFilters } | undefined;

  return filtersEntry?.filters;
}

function getClientIdFromQueryKey(queryKey: readonly unknown[]) {
  return queryKey[1] === 'byClient' && typeof queryKey[2] === 'string'
    ? queryKey[2]
    : undefined;
}

function matchesSearch(ride: RideViewModel, search?: unknown) {
  if (typeof search !== 'string' || !search.trim()) {
    return true;
  }

  const normalizedSearch = search.trim().toLowerCase();
  const haystack = [
    ride.clientName,
    ride.notes,
    ride.location,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(normalizedSearch);
}

function matchesDateRange(ride: RideViewModel, startDate?: unknown, endDate?: unknown) {
  const rideDate = (ride.rideDate || '').slice(0, 10);

  if (!rideDate) {
    return false;
  }

  if (typeof startDate === 'string' && startDate && rideDate < startDate) {
    return false;
  }

  if (typeof endDate === 'string' && endDate && rideDate > endDate) {
    return false;
  }

  return true;
}

function matchesQuery(ride: RideViewModel, queryKey: readonly unknown[]) {
  const filters = getFiltersFromQueryKey(queryKey);
  const clientIdFilter = getClientIdFromQueryKey(queryKey) || filters?.clientId;

  if (
    typeof clientIdFilter === 'string' &&
    clientIdFilter &&
    clientIdFilter !== 'all' &&
    getRideClientId(ride) !== clientIdFilter
  ) {
    return false;
  }

  if (
    typeof filters?.paymentStatus === 'string' &&
    filters.paymentStatus &&
    ride.paymentStatus !== filters.paymentStatus
  ) {
    return false;
  }

  if (!matchesDateRange(ride, filters?.startDate, filters?.endDate)) {
    return false;
  }

  return matchesSearch(ride, filters?.search);
}

function updateEnvelope(
  envelope: RideListEnvelope,
  ride: RideViewModel,
  queryKey: readonly unknown[],
) {
  const nextData = matchesQuery(ride, queryKey)
    ? upsertSortedRides(envelope.data, ride)
    : removeRide(envelope.data, ride.id);

  return {
    ...envelope,
    data: nextData,
  };
}

function isInfiniteRideListQuery(queryKey: readonly unknown[]) {
  return (
    queryKey[0] === rideKeys.all[0] &&
    ((queryKey[1] === 'list' && queryKey.at(-1) === 'infinite') ||
      (queryKey[1] === 'byClient' && queryKey[3] === 'infinite'))
  );
}

function includesClientInInfiniteRideData(
  value: unknown,
  clientId: string,
) {
  if (!isRideInfiniteData(value)) {
    return false;
  }

  return value.pages.some((page) =>
    page.data.some((ride) => getRideClientId(ride) === clientId),
  );
}

function includesClientInRideListEnvelope(value: unknown, clientId: string) {
  if (!isRideListEnvelope(value)) {
    return false;
  }

  return value.data.some((ride) => getRideClientId(ride) === clientId);
}

export function upsertRideCaches(queryClient: QueryClient, ride: RideViewModel) {
  queryClient.setQueryData(rideKeys.detail(ride.id), ride);

  const rideQueries = queryClient.getQueryCache().findAll({
    queryKey: rideKeys.all,
  });

  for (const query of rideQueries) {
    if (!isInfiniteRideListQuery(query.queryKey)) {
      continue;
    }

    queryClient.setQueryData(query.queryKey, (current: unknown) => {
      if (!isRideInfiniteData(current)) {
        return current;
      }

      return {
        ...current,
        pages: current.pages.map((page, index) =>
          index === 0
            ? updateEnvelope(page, ride, query.queryKey)
            : {
                ...page,
                data: removeRide(page.data, ride.id),
              },
        ),
      };
    });
  }
}

export function removeRideCaches(queryClient: QueryClient, rideId: string) {
  queryClient.removeQueries({
    queryKey: rideKeys.detail(rideId),
    exact: true,
  });

  const rideQueries = queryClient.getQueryCache().findAll({
    queryKey: rideKeys.all,
  });

  for (const query of rideQueries) {
    if (!isInfiniteRideListQuery(query.queryKey)) {
      continue;
    }

    queryClient.setQueryData(query.queryKey, (current: unknown) => {
      if (!isRideInfiniteData(current)) {
        return current;
      }

      return {
        ...current,
        pages: current.pages.map((page) => ({
          ...page,
          data: removeRide(page.data, rideId),
        })),
      };
    });
  }
}

export function removeRideCachesByIds(
  queryClient: QueryClient,
  rideIds: string[],
) {
  const rideIdSet = new Set(rideIds.filter(Boolean));

  if (rideIdSet.size === 0) {
    return;
  }

  for (const rideId of rideIdSet) {
    queryClient.removeQueries({
      queryKey: rideKeys.detail(rideId),
      exact: true,
    });
  }

  const rideQueries = queryClient.getQueryCache().findAll({
    queryKey: rideKeys.all,
  });

  for (const query of rideQueries) {
    if (isInfiniteRideListQuery(query.queryKey)) {
      queryClient.setQueryData(query.queryKey, (current: unknown) => {
        if (!isRideInfiniteData(current)) {
          return current;
        }

        return {
          ...current,
          pages: current.pages.map((page) => ({
            ...page,
            data: removeRideIds(page.data, rideIdSet),
          })),
        };
      });
      continue;
    }

    if (query.queryKey[1] === 'list') {
      queryClient.setQueryData(query.queryKey, (current: unknown) => {
        if (!isRideListEnvelope(current)) {
          return current;
        }

        return {
          ...current,
          data: removeRideIds(current.data, rideIdSet),
        };
      });
    }
  }
}

export function clearRideCaches(queryClient: QueryClient) {
  queryClient.removeQueries({
    predicate: (query) =>
      query.queryKey[0] === rideKeys.all[0] &&
      (query.queryKey[1] === 'detail' || query.queryKey[1] === 'count'),
  });

  const rideQueries = queryClient.getQueryCache().findAll({
    queryKey: rideKeys.all,
  });

  for (const query of rideQueries) {
    if (isInfiniteRideListQuery(query.queryKey)) {
      queryClient.setQueryData(query.queryKey, () => ({
        pages: [],
        pageParams: [],
      }));
      continue;
    }

    if (query.queryKey[1] === 'frequent-clients') {
      queryClient.setQueryData(query.queryKey, []);
      continue;
    }

    if (query.queryKey[1] === 'stats') {
      queryClient.removeQueries({
        queryKey: query.queryKey,
        exact: true,
      });
      continue;
    }

    if (query.queryKey[1] === 'list') {
      queryClient.setQueryData(query.queryKey, (current: unknown) => {
        if (!isRideListEnvelope(current)) {
          return {
            data: [],
            meta: EMPTY_RIDE_META,
          };
        }

        return {
          ...current,
          data: [],
          meta: {
            ...current.meta,
            ...EMPTY_RIDE_META,
          },
        };
      });
    }
  }
}

export function removeRideCachesByClient(
  queryClient: QueryClient,
  clientId: string,
) {
  const rideQueries = queryClient.getQueryCache().findAll({
    queryKey: rideKeys.all,
  });

  for (const query of rideQueries) {
    if (query.queryKey[1] === 'detail') {
      if (isRide(query.state.data) && getRideClientId(query.state.data) === clientId) {
        queryClient.removeQueries({
          queryKey: query.queryKey,
          exact: true,
        });
      }
      continue;
    }

    if (isInfiniteRideListQuery(query.queryKey)) {
      queryClient.setQueryData(query.queryKey, (current: unknown) => {
        if (!isRideInfiniteData(current)) {
          return current;
        }

        return {
          ...current,
          pages: current.pages.map((page) => ({
            ...page,
            data: removeRidesByClient(page.data, clientId),
          })),
        };
      });
      continue;
    }

    if (query.queryKey[1] === 'list') {
      queryClient.setQueryData(query.queryKey, (current: unknown) => {
        if (!isRideListEnvelope(current)) {
          return current;
        }

        return {
          ...current,
          data: removeRidesByClient(current.data, clientId),
        };
      });
      continue;
    }

    if (query.queryKey[1] === 'frequent-clients') {
      queryClient.invalidateQueries({
        queryKey: query.queryKey,
        exact: true,
      });
    }
  }
}

export async function invalidateRideCachesForClient(
  queryClient: QueryClient,
  clientId: string,
) {
  const tasks: Array<Promise<unknown>> = [];
  const rideQueries = queryClient.getQueryCache().findAll({
    queryKey: rideKeys.all,
  });

  for (const query of rideQueries) {
    if (query.queryKey[1] === 'stats') {
      tasks.push(
        queryClient.invalidateQueries({
          queryKey: query.queryKey,
          exact: true,
        }),
      );
      continue;
    }

    if (query.queryKey[1] === 'detail') {
      if (isRide(query.state.data) && getRideClientId(query.state.data) === clientId) {
        tasks.push(
          queryClient.invalidateQueries({
            queryKey: query.queryKey,
            exact: true,
          }),
        );
      }
      continue;
    }

    if (
      isInfiniteRideListQuery(query.queryKey) &&
      includesClientInInfiniteRideData(query.state.data, clientId)
    ) {
      tasks.push(
        queryClient.invalidateQueries({
          queryKey: query.queryKey,
          exact: true,
        }),
      );
      continue;
    }

    if (
      query.queryKey[1] === 'list' &&
      includesClientInRideListEnvelope(query.state.data, clientId)
    ) {
      tasks.push(
        queryClient.invalidateQueries({
          queryKey: query.queryKey,
          exact: true,
        }),
      );
    }
  }

  await Promise.all(tasks);
}
