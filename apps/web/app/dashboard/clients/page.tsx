"use client";
import { useEffect, useMemo, useState } from 'react';
import { ConfirmModal } from '@/components/confirm-modal';
import { ClientDetailsDrawer } from "@/components/client-details-drawer";
import { useRideSelection } from '@/hooks/use-ride-selection';
import { useRidePaymentStatus } from "@/hooks/use-ride-payment-status";
import { toast } from "sonner";
import { isApiErrorStatus, parseApiError } from "@/lib/api-error";
import { clientsService } from "@/services/clients-service";

// Services & Types
import { Client } from "@/types/rides";

// Hooks
import { useClients } from "./_hooks/use-clients";
import { useClientActions } from "./_hooks/use-client-actions";
import { useClientExport } from "./_hooks/use-client-export";
import { useClientDetailsData } from "./_hooks/use-client-details-data";
import { useClientsPageState } from "./_hooks/use-clients-page-state";

// Components
import { ClientHeader } from "./_components/client-header";
import { ClientListSection } from "./_components/client-list-section";
import { ClientModals } from "./_components/client-modals";

export default function ClientsPage() {
    const paymentStatus = useRidePaymentStatus();
    const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
    // Data Hooks
    const { 
        clients, search, setSearch, isLoading, isFetching,
        hasNextPage, isFetchingNextPage, fetchNextPage, totalCount, error, fetchClients
    } = useClients();
    const selection = useRideSelection({
        items: clients,
        scopeKey: 'clients-page',
    });
    
    const state = useClientsPageState(clients);
    
    const {
        rides, balance, isLoading: isDetailsLoading,
        hasNextPage: hasNextRidesPage,
        isFetchingNextPage: isFetchingNextRidesPage,
        fetchNextPage: fetchNextRidesPage,
        refreshDetails, isDetailsPending
    } = useClientDetailsData(state.selectedClient);

    const clientExport = useClientExport({
        client: state.selectedClient,
        isDetailsPending,
    });

    const {
        isSettling, isDeleting, isDeletingClients, isDeletingRide, isDeletingRides,
        togglePin, closeDebt, deleteClient, deleteClients, deleteRide, deleteRides
    } = useClientActions();
    const selectedClients = useMemo(
        () => clients.filter((client) => selection.selectedIds.has(client.id)),
        [clients, selection.selectedIds],
    );

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                selection.exitSelectionMode();
            }
        }

        if (!selection.isSelectionMode) {
            return;
        }

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selection.exitSelectionMode, selection.isSelectionMode]);

    useEffect(() => {
        if (!selection.isSelectionMode) {
            setIsBulkDeleteConfirmOpen(false);
        }
    }, [selection.isSelectionMode]);

    const handlePinClient = async (client: Client) => {
        await togglePin(client);
    };

    const onConfirmDeleteClient = async () => {
        if (!state.clientToDelete) return;
        const deletedClientId = state.clientToDelete.id;
        const success = await deleteClient(deletedClientId);
        if (success) {
            if (state.selectedClient?.id === deletedClientId) {
                state.closeClientHistory();
            }
            state.closeDeleteConfirm();
        }
    };

    const onConfirmCloseDebt = async () => {
        if (!state.selectedClient) return;

        const clientId = state.selectedClient.id;

        try {
            await clientsService.getClient(clientId);
        } catch (error) {
            if (isApiErrorStatus(error, 404)) {
                state.handleMissingSelectedClient(clientId);
                void fetchClients();
                toast.error("Os dados deste cliente ficaram desatualizados. Recarregamos a tela para sincronizar.");
                return;
            }

            toast.error(parseApiError(error, "Erro ao validar os dados do cliente."));
            return;
        }

        const result = await closeDebt(clientId);
        if (result.success) {
            refreshDetails();
            state.setIsCloseDebtConfirmOpen(false);
            return;
        }

        if (result.reason === "missing-client") {
            state.handleMissingSelectedClient(clientId);
            void fetchClients();
        }
    };

    const handleClientSuccess = (client: Client) => {
        if (state.modalClient?.id === client.id) {
            state.setModalClient(client);
        }
    };

    const onConfirmDeleteRide = async () => {
        if (!state.rideToDelete) return;
        const success = await deleteRide(state.rideToDelete);
        if (success) {
            state.setRideToDelete(null);
        }
    };

    const onConfirmDeleteClients = async () => {
        if (selectedClients.length === 0) {
            setIsBulkDeleteConfirmOpen(false);
            return;
        }

        const selectedClientIds = new Set(selectedClients.map((client) => client.id));
        const success = await deleteClients(selectedClients);

        if (!success.success) {
            return;
        }

        if (state.selectedClient?.id && selectedClientIds.has(state.selectedClient.id)) {
            state.closeClientHistory();
        }

        selection.exitSelectionMode();
        setIsBulkDeleteConfirmOpen(false);
    };

    return (
        <>
            <div
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar-hide"
                data-scroll-lock-root="true"
            >
                <div className="mx-auto flex w-full max-w-[1400px] flex-col pb-8">
                    <div className="hidden shrink-0 flex-col gap-8 pb-8 md:flex">
                        <ClientHeader onNewClient={state.openNewClientModal} />
                    </div>

                    <ClientListSection 
                        clients={clients}
                        isLoading={isLoading}
                        isFetching={isFetching}
                        search={search}
                        onSearchChange={setSearch}
                        onNewClient={state.openNewClientModal}
                        hasNextPage={hasNextPage}
                        isFetchingNextPage={isFetchingNextPage}
                        onLoadMore={fetchNextPage}
                        totalCount={totalCount}
                        error={error}
                        retry={fetchClients}
                        onEdit={state.openEditClientModal}
                        onDelete={state.openDeleteClientConfirm}
                        onPin={handlePinClient}
                        onQuickRide={state.openQuickRideModal}
                        onViewHistory={state.openClientHistory}
                        selection={{
                            isSelectionMode: selection.isSelectionMode,
                            selectedCount: selection.selectedCount,
                            totalVisible: selection.totalVisible,
                            isClientSelected: selection.isSelected,
                            onEnterSelectionMode: selection.enterSelectionMode,
                            onExitSelectionMode: selection.exitSelectionMode,
                            onToggleClientSelection: selection.toggleItem,
                            onToggleSelectAllVisible: selection.selectAllVisible,
                            isAllVisibleSelected: selection.isAllVisibleSelected,
                            isSelectionIndeterminate: selection.isIndeterminate,
                            onDeleteSelected: () => setIsBulkDeleteConfirmOpen(true),
                            isDeletingSelected: isDeletingClients,
                        }}
                    />
                </div>
            </div>

            <ClientDetailsDrawer
                client={state.selectedClient}
                rides={rides}
                balance={balance}
                isLoading={isDetailsLoading}
                hasNextPage={hasNextRidesPage}
                isFetchingNextPage={isFetchingNextRidesPage}
                fetchNextPage={fetchNextRidesPage}
                isSettling={isSettling}
                clientExport={clientExport}
                onClose={state.closeClientHistory}
                onNewRide={() => state.setIsRideModalOpen(true)}
                onCloseDebt={() => state.setIsCloseDebtConfirmOpen(true)}
                onAddPayment={() => state.setIsPaymentModalOpen(true)}
                onEditRide={state.openEditRideModal}
                onDeleteRide={state.setRideToDelete}
                onDeleteRides={deleteRides}
                onChangePaymentStatus={paymentStatus.setPaymentStatus}
                isPaymentUpdating={paymentStatus.isUpdatingRide}
                isDeletingRides={isDeletingRides}
            />

            <ClientModals 
                selectedClient={state.selectedClient}
                modalClient={state.modalClient}
                clientToEdit={state.clientToEdit}
                clientToDelete={state.clientToDelete}
                rideToEdit={state.rideToEdit}
                rideToDelete={state.rideToDelete}
                isClientModalOpen={state.isClientModalOpen}
                isRideModalOpen={state.isRideModalOpen}
                isPaymentModalOpen={state.isPaymentModalOpen}
                isDeleteConfirmOpen={state.isDeleteConfirmOpen}
                isCloseDebtConfirmOpen={state.isCloseDebtConfirmOpen}
                isSettling={isSettling}
                isDeleting={isDeleting}
                isDeletingRide={isDeletingRide}
                onCloseClientModal={state.closeClientModal}
                onCloseRideModal={state.closeRideModal}
                onClosePaymentModal={() => state.setIsPaymentModalOpen(false)}
                onCloseDeleteConfirm={state.closeDeleteConfirm}
                onCloseCloseDebtConfirm={() => state.setIsCloseDebtConfirmOpen(false)}
                onCloseDeleteRideConfirm={() => state.setRideToDelete(null)}
                onConfirmDeleteClient={onConfirmDeleteClient}
                onConfirmCloseDebt={onConfirmCloseDebt}
                onConfirmDeleteRide={onConfirmDeleteRide}
                onSuccessClient={handleClientSuccess}
                onSuccessPayment={refreshDetails}
                onSuccessRide={refreshDetails}
            />

            <ConfirmModal
                isOpen={isBulkDeleteConfirmOpen}
                onClose={() => setIsBulkDeleteConfirmOpen(false)}
                onConfirm={onConfirmDeleteClients}
                title="Excluir clientes selecionados"
                description={
                    selection.selectedCount === 1
                        ? 'Deseja realmente excluir o cliente selecionado? Esta acao e irreversivel e tambem removera corridas, pagamentos e dados relacionados.'
                        : `Deseja realmente excluir os ${selection.selectedCount} clientes selecionados? Esta acao e irreversivel e tambem removera corridas, pagamentos e dados relacionados.`
                }
                confirmText="Excluir selecionados"
                variant="danger"
                isLoading={isDeletingClients}
            />
        </>
    );
}
