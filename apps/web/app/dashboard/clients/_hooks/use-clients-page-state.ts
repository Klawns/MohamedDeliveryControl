'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { isApiErrorStatus } from '@/lib/api-error';
import { removeClientCaches } from '@/lib/client-cache';
import { clientKeys } from '@/lib/query-keys';
import { removeRideCachesByClient } from '@/lib/ride-cache';
import { clientsService } from '@/services/clients-service';
import { type Client, type RideViewModel } from '@/types/rides';

const FALLBACK_CLIENTS_PATH = '/dashboard/clients';

export function useClientsPageState(clients: Client[] = []) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [modalClient, setModalClient] = useState<Client | null>(null);
  const [isRideModalOpen, setIsRideModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isCloseDebtConfirmOpen, setIsCloseDebtConfirmOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [rideToEdit, setRideToEdit] = useState<RideViewModel | null>(null);
  const [rideToDelete, setRideToDelete] = useState<RideViewModel | null>(null);
  const selectedClientIdFromUrl = searchParams.get('clientId');
  const clientsPagePath = pathname.includes('/clients') ? pathname : FALLBACK_CLIENTS_PATH;

  const selectedClientInitialData = useMemo(
    () =>
      selectedClientIdFromUrl
        ? clients.find((client) => client.id === selectedClientIdFromUrl) ?? null
        : null,
    [clients, selectedClientIdFromUrl],
  );

  const { data: selectedClient = null, error: selectedClientError } = useQuery({
    queryKey: selectedClientIdFromUrl
      ? clientKeys.detail(selectedClientIdFromUrl)
      : [...clientKeys.all, 'detail', 'empty'],
    queryFn: ({ signal }) => clientsService.getClient(selectedClientIdFromUrl!, signal),
    enabled: !!selectedClientIdFromUrl,
    initialData: selectedClientInitialData ?? undefined,
    staleTime: 60000,
    retry: false,
  });

  const replaceSelectedClientInUrl = (clientId?: string) => {
    const nextSearchParams = new URLSearchParams(searchParams.toString());

    if (clientId) {
      nextSearchParams.set('clientId', clientId);
    } else {
      nextSearchParams.delete('clientId');
    }

    const nextQueryString = nextSearchParams.toString();
    router.replace(nextQueryString ? `${clientsPagePath}?${nextQueryString}` : clientsPagePath, {
      scroll: false,
    });
  };

  const handleMissingSelectedClient = useCallback(
    (clientId?: string) => {
      const resolvedClientId =
        clientId || selectedClientIdFromUrl || selectedClient?.id || modalClient?.id;

      if (resolvedClientId) {
        removeClientCaches(queryClient, resolvedClientId);
        removeRideCachesByClient(queryClient, resolvedClientId);
      }

      setModalClient(null);
      setIsRideModalOpen(false);
      setIsPaymentModalOpen(false);
      setIsCloseDebtConfirmOpen(false);
      setRideToEdit(null);
      setRideToDelete(null);
      replaceSelectedClientInUrl();
    },
    [modalClient?.id, queryClient, selectedClient?.id, selectedClientIdFromUrl, searchParams],
  );

  useEffect(() => {
    if (!selectedClientIdFromUrl || !isApiErrorStatus(selectedClientError, 404)) {
      return;
    }

    handleMissingSelectedClient(selectedClientIdFromUrl);
  }, [handleMissingSelectedClient, selectedClientError, selectedClientIdFromUrl]);

  const openNewClientModal = () => {
    setClientToEdit(null);
    setIsClientModalOpen(true);
  };

  const openEditClientModal = (client: Client) => {
    setClientToEdit(client);
    setIsClientModalOpen(true);
  };

  const openQuickRideModal = (client: Client) => {
    setModalClient(client);
    setRideToEdit(null);
    setIsRideModalOpen(true);
  };

  const openDeleteClientConfirm = (client: Client) => {
    setClientToDelete(client);
    setIsDeleteConfirmOpen(true);
  };

  const openClientHistory = (client: Client) => {
    queryClient.setQueryData(clientKeys.detail(client.id), client);
    setModalClient(client);
    replaceSelectedClientInUrl(client.id);
  };

  const openEditRideModal = (ride: RideViewModel) => {
    setRideToEdit(ride);
    setIsRideModalOpen(true);
  };

  const closeClientModal = () => {
    setIsClientModalOpen(false);
    setClientToEdit(null);
  };

  const closeDeleteConfirm = () => {
    setIsDeleteConfirmOpen(false);
    setClientToDelete(null);
  };

  const closeRideModal = () => {
    setIsRideModalOpen(false);
    setRideToEdit(null);

    if (!selectedClient) {
      setModalClient(null);
    }
  };

  const closeClientHistory = () => {
    setModalClient(null);
    setRideToEdit(null);
    setRideToDelete(null);
    replaceSelectedClientInUrl();
  };

  return {
    selectedClient,
    modalClient,
    setModalClient,
    closeClientHistory,
    isRideModalOpen,
    setIsRideModalOpen,
    isClientModalOpen,
    setIsClientModalOpen,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    isDeleteConfirmOpen,
    setIsDeleteConfirmOpen,
    isCloseDebtConfirmOpen,
    setIsCloseDebtConfirmOpen,
    clientToEdit,
    clientToDelete,
    rideToEdit,
    rideToDelete,
    setRideToDelete,
    handleMissingSelectedClient,
    openNewClientModal,
    openEditClientModal,
    openDeleteClientConfirm,
    openQuickRideModal,
    openClientHistory,
    openEditRideModal,
    closeClientModal,
    closeDeleteConfirm,
    closeRideModal,
  };
}
