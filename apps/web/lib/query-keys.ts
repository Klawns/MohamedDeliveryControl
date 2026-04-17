type QueryFilters = Record<string, unknown>;

function hasPrefix(queryKey: readonly unknown[], prefix: readonly unknown[]) {
  return prefix.every((entry, index) => queryKey[index] === entry);
}

function isFilterContainer(
  value: unknown,
): value is { filters: QueryFilters & Record<string, unknown> } {
  return !!value && typeof value === 'object' && 'filters' in value;
}

export const rideKeys = {
  all: ['rides'] as const,
  lists: () => [...rideKeys.all, 'list'] as const,
  list: (filters: QueryFilters = {}) =>
    [...rideKeys.lists(), { filters }] as const,
  infinite: (filters: QueryFilters = {}) =>
    [...rideKeys.lists(), { filters }, 'infinite'] as const,
  details: () => [...rideKeys.all, 'detail'] as const,
  detail: (id: string) => [...rideKeys.details(), id] as const,
  stats: (filters: QueryFilters) =>
    [...rideKeys.all, 'stats', { filters }] as const,
  count: () => [...rideKeys.all, 'count'] as const,
  byClient: (clientId: string, filters: QueryFilters = {}) =>
    [...rideKeys.all, 'byClient', clientId, 'infinite', { filters }] as const,
  frequentClients: () => [...rideKeys.all, 'frequent-clients'] as const,
};

export const clientKeys = {
  all: ['clients'] as const,
  lists: () => [...clientKeys.all, 'list'] as const,
  list: (filters: QueryFilters = {}) =>
    [...clientKeys.lists(), { filters }] as const,
  infiniteLists: () => [...clientKeys.lists(), 'infinite'] as const,
  infinite: (filters: QueryFilters = {}) =>
    [...clientKeys.infiniteLists(), { filters }] as const,
  directories: () => [...clientKeys.all, 'directory'] as const,
  directory: (filters: QueryFilters = {}) =>
    [...clientKeys.directories(), { filters }] as const,
  details: () => [...clientKeys.all, 'detail'] as const,
  detail: (id: string) => [...clientKeys.details(), id] as const,
  balance: (id: string) => [...clientKeys.detail(id), 'balance'] as const,
  payments: (id: string, filters: QueryFilters = {}) =>
    [...clientKeys.detail(id), 'payments', { filters }] as const,
};

export type ClientListQueryKey = ReturnType<typeof clientKeys.list>;
export type ClientInfiniteQueryKey = ReturnType<typeof clientKeys.infinite>;
export type ClientDirectoryQueryKey = ReturnType<typeof clientKeys.directory>;
export type ClientPaymentsQueryKey = ReturnType<typeof clientKeys.payments>;

export const clientKeyUtils = {
  isList(queryKey: readonly unknown[]): queryKey is ClientListQueryKey {
    return (
      hasPrefix(queryKey, clientKeys.lists()) &&
      queryKey.length === 3 &&
      isFilterContainer(queryKey[2])
    );
  },
  isInfinite(queryKey: readonly unknown[]): queryKey is ClientInfiniteQueryKey {
    return (
      hasPrefix(queryKey, clientKeys.infiniteLists()) &&
      queryKey.length === 4 &&
      isFilterContainer(queryKey[3])
    );
  },
  isDirectory(
    queryKey: readonly unknown[],
  ): queryKey is ClientDirectoryQueryKey {
    return (
      hasPrefix(queryKey, clientKeys.directories()) &&
      queryKey.length === 3 &&
      isFilterContainer(queryKey[2])
    );
  },
  isPayments(
    queryKey: readonly unknown[],
    clientId: string,
  ): queryKey is ClientPaymentsQueryKey {
    return (
      hasPrefix(queryKey, clientKeys.detail(clientId)) &&
      queryKey[3] === 'payments' &&
      queryKey.length === 5 &&
      isFilterContainer(queryKey[4])
    );
  },
  getListFilters(queryKey: ClientListQueryKey) {
    return queryKey[2].filters;
  },
  getInfiniteFilters(queryKey: ClientInfiniteQueryKey) {
    return queryKey[3].filters;
  },
  getDirectoryFilters(queryKey: ClientDirectoryQueryKey) {
    return queryKey[2].filters;
  },
  getPaymentsFilters(queryKey: ClientPaymentsQueryKey) {
    return queryKey[4].filters;
  },
};

export const settingsKeys = {
  all: ['settings'] as const,
  presets: () => [...settingsKeys.all, 'presets'] as const,
  backups: () => [...settingsKeys.all, 'backups'] as const,
  backupsStatus: () => [...settingsKeys.all, 'backups-status'] as const,
  backupImport: (id: string) => [...settingsKeys.all, 'backup-import', id] as const,
};

export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'me'] as const,
};

export const paymentKeys = {
  all: ['payments'] as const,
  plans: () => [...paymentKeys.all, 'plans'] as const,
};

export const financeKeys = {
  all: ['finance'] as const,
  dashboard: (filters: QueryFilters) =>
    [...financeKeys.all, 'dashboard', { filters }] as const,
};

export const adminKeys = {
  all: ['admin'] as const,
  stats: () => [...adminKeys.all, 'stats'] as const,
  usersAll: () => [...adminKeys.all, 'users'] as const,
  users: (filters: { page?: number; limit?: number; search?: string }) =>
    [...adminKeys.usersAll(), filters] as const,
  settings: () => [...adminKeys.all, 'settings'] as const,
  configs: () => [...adminKeys.settings(), 'configs'] as const,
  plans: () => [...adminKeys.settings(), 'plans'] as const,
  promoCodes: () => [...adminKeys.settings(), 'promo-codes'] as const,
  technicalBackups: () => [...adminKeys.settings(), 'technical-backups'] as const,
  systemBackupSettings: () =>
    [...adminKeys.settings(), 'system-backup-settings'] as const,
};
