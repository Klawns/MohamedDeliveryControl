import { type InfiniteData, type QueryClient } from '@tanstack/react-query';
import {
  mergeClientDirectoryEntries,
  toClientDirectoryEntry,
} from '@/lib/client-directory';
import { clientKeyUtils, clientKeys } from '@/lib/query-keys';
import { type ApiEnvelope } from '@/services/api';
import { type ClientDirectoryMeta } from '@/services/clients-service';
import { type ClientPayment } from '@/types/client-payments';
import {
  type Client,
  type ClientDirectoryEntry,
  type CursorMeta,
} from '@/types/rides';

type ClientListEnvelope = ApiEnvelope<Client[], CursorMeta>;
type ClientInfiniteData = InfiniteData<ClientListEnvelope, string | undefined>;
type ClientDirectoryEnvelope = ApiEnvelope<
  ClientDirectoryEntry[],
  ClientDirectoryMeta
>;

const EMPTY_CLIENT_META = {
  hasNextPage: false,
  nextCursor: undefined,
  total: 0,
} satisfies CursorMeta & { total: number };

const EMPTY_DIRECTORY_META: ClientDirectoryMeta = {
  returned: 0,
  limit: 20,
  hasMore: false,
  search: undefined,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object';
}

function isClientListEnvelope(value: unknown): value is ClientListEnvelope {
  return isRecord(value) && Array.isArray(value.data) && isRecord(value.meta);
}

function isClientDirectoryEnvelope(
  value: unknown,
): value is ClientDirectoryEnvelope {
  return isRecord(value) && Array.isArray(value.data) && isRecord(value.meta);
}

function isClientInfiniteData(value: unknown): value is ClientInfiniteData {
  return (
    isRecord(value) &&
    Array.isArray(value.pages) &&
    Array.isArray(value.pageParams)
  );
}

function compareClientLike(
  left: { id: string; name: string; isPinned?: boolean },
  right: { id: string; name: string; isPinned?: boolean },
) {
  if (!!left.isPinned !== !!right.isPinned) {
    return left.isPinned ? -1 : 1;
  }

  const nameComparison = (left.name || '').localeCompare(right.name || '', 'pt-BR', {
    sensitivity: 'base',
  });

  if (nameComparison !== 0) {
    return nameComparison;
  }

  return left.id.localeCompare(right.id);
}

function upsertSortedClients(clients: Client[], client: Client) {
  return Array.from(
    new Map([...clients, client].map((item) => [item.id, item])).values(),
  ).sort(compareClientLike);
}

function removeClient<T extends { id: string }>(clients: T[], clientId: string) {
  return clients.filter((client) => client.id !== clientId);
}

function removeClients<T extends { id: string }>(
  clients: T[],
  clientIds: Set<string>,
) {
  return clients.filter((client) => !clientIds.has(client.id));
}

function matchesSearch(name: string, search?: string) {
  if (!search?.trim()) {
    return true;
  }

  return name.toLowerCase().includes(search.trim().toLowerCase());
}

function getSearch(filters: Record<string, unknown>) {
  return typeof filters.search === 'string' ? filters.search : undefined;
}

function getStatusFromPaymentsQueryKey(queryKey: ReturnType<typeof clientKeys.payments>) {
  const filters = clientKeyUtils.getPaymentsFilters(queryKey);
  return typeof filters.status === 'string' ? filters.status : undefined;
}

function updateClientListEnvelope(
  envelope: ClientListEnvelope,
  client: Client,
  search?: string,
) {
  const nextData = matchesSearch(client.name, search)
    ? upsertSortedClients(envelope.data, client)
    : removeClient(envelope.data, client.id);

  return {
    ...envelope,
    data: nextData,
  };
}

function updateClientDirectoryEnvelope(
  envelope: ClientDirectoryEnvelope,
  client: Client,
  search?: string,
) {
  const directoryEntry = toClientDirectoryEntry(client);
  const nextData = matchesSearch(directoryEntry.name, search)
    ? mergeClientDirectoryEntries(envelope.data, directoryEntry).slice(
        0,
        envelope.meta.limit,
      )
    : removeClient(envelope.data, directoryEntry.id);

  return {
    ...envelope,
    data: nextData,
    meta: {
      ...envelope.meta,
      returned: nextData.length,
      hasMore: envelope.meta.hasMore || nextData.length >= envelope.meta.limit,
    },
  };
}

function upsertSortedPayments(payments: ClientPayment[], payment: ClientPayment) {
  return Array.from(
    new Map([payment, ...payments].map((item) => [item.id, item])).values(),
  ).sort((left, right) => (right.paymentDate || '').localeCompare(left.paymentDate || ''));
}

export function upsertClientCaches(queryClient: QueryClient, client: Client) {
  queryClient.setQueryData(clientKeys.detail(client.id), client);

  const clientQueries = queryClient.getQueryCache().findAll({
    queryKey: clientKeys.all,
  });

  for (const query of clientQueries) {
    if (clientKeyUtils.isInfinite(query.queryKey)) {
      const infiniteQueryKey = query.queryKey;

      queryClient.setQueryData(query.queryKey, (current: unknown) => {
        if (!isClientInfiniteData(current)) {
          return current;
        }

        const search = getSearch(clientKeyUtils.getInfiniteFilters(infiniteQueryKey));
        const [firstPage, ...remainingPages] = current.pages;

        if (!firstPage) {
          return current;
        }

        return {
          ...current,
          pages: [
            updateClientListEnvelope(firstPage, client, search),
            ...remainingPages,
          ],
        };
      });

      continue;
    }

    if (clientKeyUtils.isList(query.queryKey)) {
      const listQueryKey = query.queryKey;

      queryClient.setQueryData(query.queryKey, (current: unknown) => {
        if (!isClientListEnvelope(current)) {
          return current;
        }

        return updateClientListEnvelope(
          current,
          client,
          getSearch(clientKeyUtils.getListFilters(listQueryKey)),
        );
      });

      continue;
    }

    if (clientKeyUtils.isDirectory(query.queryKey)) {
      const directoryQueryKey = query.queryKey;

      queryClient.setQueryData(query.queryKey, (current: unknown) => {
        if (!isClientDirectoryEnvelope(current)) {
          return current;
        }

        return updateClientDirectoryEnvelope(
          current,
          client,
          getSearch(clientKeyUtils.getDirectoryFilters(directoryQueryKey)),
        );
      });
    }
  }
}

export function removeClientCaches(queryClient: QueryClient, clientId: string) {
  removeClientCachesByIds(queryClient, [clientId]);
}

export function removeClientCachesByIds(
  queryClient: QueryClient,
  clientIds: string[],
) {
  const clientIdSet = new Set(clientIds.filter(Boolean));

  if (clientIdSet.size === 0) {
    return;
  }

  queryClient.removeQueries({
    predicate: (query) =>
      clientKeys.details().every(
        (entry, index) => query.queryKey[index] === entry,
      ) &&
      typeof query.queryKey[2] === 'string' &&
      clientIdSet.has(query.queryKey[2]),
  });

  const clientQueries = queryClient.getQueryCache().findAll({
    queryKey: clientKeys.all,
  });

  for (const query of clientQueries) {
    if (clientKeyUtils.isInfinite(query.queryKey)) {
      queryClient.setQueryData(query.queryKey, (current: unknown) => {
        if (!isClientInfiniteData(current)) {
          return current;
        }

        return {
          ...current,
          pages: current.pages.map((page) => ({
            ...page,
            data: removeClients(page.data, clientIdSet),
          })),
        };
      });

      continue;
    }

    if (clientKeyUtils.isList(query.queryKey)) {
      queryClient.setQueryData(query.queryKey, (current: unknown) => {
        if (!isClientListEnvelope(current)) {
          return current;
        }

        return {
          ...current,
          data: removeClients(current.data, clientIdSet),
        };
      });

      continue;
    }

    if (clientKeyUtils.isDirectory(query.queryKey)) {
      queryClient.setQueryData(query.queryKey, (current: unknown) => {
        if (!isClientDirectoryEnvelope(current)) {
          return current;
        }

        const nextData = removeClients(current.data, clientIdSet);

        return {
          ...current,
          data: nextData,
          meta: {
            ...current.meta,
            returned: nextData.length,
            hasMore:
              current.meta.hasMore || nextData.length >= current.meta.limit,
          },
        };
      });
    }
  }
}

export function upsertClientPaymentCaches(
  queryClient: QueryClient,
  payment: ClientPayment,
) {
  const paymentQueries = queryClient.getQueryCache().findAll({
    queryKey: clientKeys.detail(payment.clientId),
  });

  for (const query of paymentQueries) {
    if (!clientKeyUtils.isPayments(query.queryKey, payment.clientId)) {
      continue;
    }

    const paymentsQueryKey = query.queryKey;

    queryClient.setQueryData(query.queryKey, (current: unknown) => {
      if (!Array.isArray(current)) {
        return current;
      }

      const status = getStatusFromPaymentsQueryKey(paymentsQueryKey);

      if (status && status !== payment.status) {
        return current;
      }

      return upsertSortedPayments(current as ClientPayment[], payment);
    });
  }
}

export function clearClientCaches(queryClient: QueryClient) {
  queryClient.removeQueries({
    queryKey: clientKeys.details(),
  });

  const clientQueries = queryClient.getQueryCache().findAll({
    queryKey: clientKeys.all,
  });

  for (const query of clientQueries) {
    if (clientKeyUtils.isInfinite(query.queryKey)) {
      queryClient.setQueryData(query.queryKey, () => ({
        pages: [],
        pageParams: [],
      }));
      continue;
    }

    if (clientKeyUtils.isList(query.queryKey)) {
      queryClient.setQueryData(query.queryKey, (current: unknown) => {
        if (!isClientListEnvelope(current)) {
          return {
            data: [],
            meta: EMPTY_CLIENT_META,
          };
        }

        return {
          ...current,
          data: [],
          meta: {
            ...current.meta,
            ...EMPTY_CLIENT_META,
          },
        };
      });

      continue;
    }

    if (clientKeyUtils.isDirectory(query.queryKey)) {
      queryClient.setQueryData(query.queryKey, (current: unknown) => {
        if (!isClientDirectoryEnvelope(current)) {
          return {
            data: [],
            meta: EMPTY_DIRECTORY_META,
          };
        }

        return {
          ...current,
          data: [],
          meta: {
            ...current.meta,
            ...EMPTY_DIRECTORY_META,
          },
        };
      });
    }
  }
}
