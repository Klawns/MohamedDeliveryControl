"use client";

import { useRides } from "./hooks/use-rides";
import { RidesHeader } from "./components/rides-header";
import { FrequentClients } from "./components/frequent-clients";
import { RidesFilters } from "./components/rides-filters";
import { RidesListContainer } from "./components/rides-list";
import { RidesPagination } from "./components/rides-pagination";
import { RideModal } from "@/components/ride-modal";
import { ConfirmModal } from "@/components/confirm-modal";

/**
 * Página de Histórico de Corridas.
 * 
 * Atua como um orquestrador que:
 * 1. Consome a lógica centralizada no hook useRides.
 * 2. Distribui estados e ações para subcomponentes especializados.
 * 3. Gerencia a visibilidade de modais e fluxos de confirmação.
 */
export default function RidesPage() {
    const {
        // Dados
        rides,
        clients,
        frequentClients,
        isLoading,
        isFetching,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
        ridesError,
        isFrequentLoading,
        totalCount,
        
        // Filtros
        filterState,
        setSearch,
        setPaymentFilter,
        setClientFilter,
        setStartDate,
        setEndDate,
        isFiltersOpen,
        setIsFiltersOpen,
        hasActiveFilters,
        clearFilters,
        
        // Modais
        isRideModalOpen,
        setIsRideModalOpen,
        selectedQuickClient,
        setSelectedQuickClient,
        rideToEdit,
        setRideToEdit,
        rideToDelete,
        setRideToDelete,
        isDeleting,
        handleEditRide,
        handleDeleteRide,
        
        // Ações
        fetchData,
        togglePaymentStatus,
        closeRideModal,
        openCreateModal,
        openQuickCreateModal
    } = useRides();

    return (
        <div className="p-4 md:p-8 space-y-8 pb-32 max-w-[1400px] mx-auto min-h-screen">
            {/* Cabeçalho com ação de nova corrida */}
            <RidesHeader onNewRide={openCreateModal} />

            {/* Acesso rápido: Clientes frequentes */}
            <FrequentClients 
                clients={frequentClients} 
                isLoading={isFrequentLoading} 
                onSelectClient={openQuickCreateModal} 
            />

            {/* Barra de busca e filtros avançados */}
            <RidesFilters 
                filters={filterState}
                setSearch={setSearch}
                setPaymentFilter={setPaymentFilter}
                setClientFilter={setClientFilter}
                setStartDate={setStartDate}
                setEndDate={setEndDate}
                isFiltersOpen={isFiltersOpen}
                setIsFiltersOpen={setIsFiltersOpen}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={clearFilters}
                clients={clients}
            />

            {/* Listagem de corridas com ações de edição/deleção */}
            <RidesListContainer 
                rides={rides}
                isLoading={isLoading}
                isFetching={isFetching}
                hasNextPage={hasNextPage}
                onLoadMore={fetchNextPage}
                isFetchingNextPage={isFetchingNextPage}
                error={ridesError}
                retry={fetchData}
                onEdit={handleEditRide}
                onDelete={setRideToDelete}
                onTogglePayment={togglePaymentStatus}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={clearFilters}
            />

            {/* Modal para Criação/Edição */}
            <RideModal
                isOpen={isRideModalOpen}
                onClose={closeRideModal}
                onSuccess={() => {
                    fetchData();
                    closeRideModal();
                }}
                rideToEdit={rideToEdit || undefined}
                clientId={selectedQuickClient?.id}
                clientName={selectedQuickClient?.name}
            />

            {/* Modal de Confirmação para Exclusão */}
            <ConfirmModal
                isOpen={!!rideToDelete}
                onClose={() => setRideToDelete(null)}
                onConfirm={handleDeleteRide}
                title="Excluir Corrida"
                description="Tem certeza que deseja excluir esta corrida? Esta ação é irreversível."
                variant="danger"
                isLoading={isDeleting}
            />
        </div>
    );
}
