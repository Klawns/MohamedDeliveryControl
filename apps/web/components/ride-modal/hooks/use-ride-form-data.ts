'use client';

import { useDeferredValue } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useClientDirectory } from '@/hooks/use-client-directory';
import { clientKeys, settingsKeys } from '@/lib/query-keys';
import { rideModalService } from '../services/ride-modal-service';

interface UseRideFormDataProps {
  isOpen?: boolean;
  userId?: string;
  clientSearch: string;
  selectedClientId: string;
  shouldLoadDirectory?: boolean;
}

export function useRideFormData({
  isOpen,
  userId,
  clientSearch,
  selectedClientId,
  shouldLoadDirectory = true,
}: UseRideFormDataProps) {
  const isEnabled = Boolean(isOpen && userId);
  const canLoadDirectory = isEnabled && shouldLoadDirectory;
  const deferredClientSearch = useDeferredValue(clientSearch.trim());

  const clientDirectory = useClientDirectory({
    enabled: canLoadDirectory,
    search: deferredClientSearch,
    limit: 24,
    selectedClientId,
  });

  const { data: presets = [], isLoading: isLoadingPresets } = useQuery({
    queryKey: settingsKeys.presets(),
    queryFn: () => rideModalService.getRidePresets(),
    enabled: isEnabled,
  });

  const { data: clientBalanceData } = useQuery({
    queryKey: selectedClientId
      ? clientKeys.balance(selectedClientId)
      : [...clientKeys.all, 'balance', 'empty'],
    queryFn: () => rideModalService.getClientBalance(selectedClientId),
    enabled: isEnabled && !!selectedClientId,
    staleTime: 30000,
  });

  return {
    clients: canLoadDirectory ? clientDirectory.clients : [],
    presets,
    clientBalance: clientBalanceData?.clientBalance || 0,
    isLoadingData: (canLoadDirectory && clientDirectory.isLoading) || isLoadingPresets,
    isFetchingClients: canLoadDirectory ? clientDirectory.isFetching : false,
    isClientDirectoryError: canLoadDirectory ? clientDirectory.isError : false,
    clientDirectoryError: canLoadDirectory ? clientDirectory.error : null,
    retryClientDirectory: clientDirectory.refetch,
    isClientDirectoryReady: canLoadDirectory ? clientDirectory.isReady : true,
    clientDirectoryMeta: canLoadDirectory ? clientDirectory.meta : null,
  };
}
