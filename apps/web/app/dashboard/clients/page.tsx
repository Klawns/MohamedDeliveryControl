"use client";
import { ClientDetailsDrawer } from "@/components/client-details-drawer";
import { useRidePaymentStatus } from "@/hooks/use-ride-payment-status";

// Services & Types
import { Client } from "@/types/rides";

// Hooks
import { useClients } from "./_hooks/use-clients";
import { useClientActions } from "./_hooks/use-client-actions";
import { useClientDetailsData } from "./_hooks/use-client-details-data";
import { useClientsPageState } from "./_hooks/use-clients-page-state";

// Components
import { ClientHeader } from "./_components/client-header";
import { ClientListSection } from "./_components/client-list-section";
import { ClientModals } from "./_components/client-modals";

export default function ClientsPage() {
    const paymentStatus = useRidePaymentStatus();
    // Data Hooks
    const { 
        clients, search, setSearch, isLoading, isFetching,
        hasNextPage, isFetchingNextPage, fetchNextPage, totalCount, error, fetchClients
    } = useClients();
    
    const state = useClientsPageState(clients);
    
    const {
        rides, balance, isLoading: isDetailsLoading,
        hasNextPage: hasNextRidesPage,
        isFetchingNextPage: isFetchingNextRidesPage,
        fetchNextPage: fetchNextRidesPage,
        refreshDetails, generatePDF, generateExcel,
        isDetailsPending, isExportingPdf, isExportingExcel
    } = useClientDetailsData(state.selectedClient);

    const {
        isSettling, isDeleting, isDeletingRide,
        togglePin, closeDebt, deleteClient, deleteRide
    } = useClientActions();

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
        const success = await closeDebt(state.selectedClient.id);
        if (success) {
            refreshDetails();
            state.setIsCloseDebtConfirmOpen(false);
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
            refreshDetails();
        }
    };

    return (
        <>
            <div
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar-hide"
                data-scroll-lock-root="true"
            >
                <div className="mx-auto flex w-full max-w-[1400px] flex-col pb-8">
                    <div className="flex shrink-0 flex-col gap-8 pb-8">
                        <ClientHeader
                            onNewClient={state.openNewClientModal}
                            totalCount={totalCount}
                            hasActiveSearch={search.trim().length > 0}
                        />
                    </div>

                    <ClientListSection 
                        clients={clients}
                        isLoading={isLoading}
                        isFetching={isFetching}
                        search={search}
                        onSearchChange={setSearch}
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
                isExportingPdf={isExportingPdf}
                isExportingExcel={isExportingExcel}
                isExportDisabled={isDetailsPending}
                onClose={state.closeClientHistory}
                onNewRide={() => state.setIsRideModalOpen(true)}
                onCloseDebt={() => state.setIsCloseDebtConfirmOpen(true)}
                onAddPayment={() => state.setIsPaymentModalOpen(true)}
                onGeneratePDF={generatePDF}
                onGenerateExcel={generateExcel}
                onEditRide={state.openEditRideModal}
                onDeleteRide={state.setRideToDelete}
                onChangePaymentStatus={paymentStatus.setPaymentStatus}
                isPaymentUpdating={paymentStatus.isUpdatingRide}
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
        </>
    );
}
