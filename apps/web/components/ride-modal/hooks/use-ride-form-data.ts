'use client';

import { useQuery } from '@tanstack/react-query';
import { clientKeys, settingsKeys } from '@/lib/query-keys';
import { rideModalService } from '../services/ride-modal-service';

interface UseRideFormDataProps {
  isOpen?: boolean;
  userId?: string;
  clientId?: string;
  selectedClientId: string;
}

export function useRideFormData({
  isOpen,
  userId,
  clientId,
  selectedClientId,
}: UseRideFormDataProps) {
  const isEnabled = Boolean(isOpen && userId);

  const { data: clientsData, isLoading: isLoadingClients } = useQuery({
    queryKey: clientKeys.lists(),
    queryFn: () => rideModalService.getClients(),
    enabled: isEnabled && !clientId,
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
    clients: clientsData?.data ?? [],
    presets,
    clientBalance: clientBalanceData?.clientBalance || 0,
    isLoadingData: isLoadingClients || isLoadingPresets,
  };
}
