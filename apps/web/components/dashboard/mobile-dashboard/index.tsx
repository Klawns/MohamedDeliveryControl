"use client";

import { useAuth } from "@/hooks/use-auth";
import { ridesService } from "@/services/rides-service";
import { useToast } from "@/hooks/use-toast";

// Hooks
import { useMobileDashboardData } from "./hooks/use-mobile-dashboard-data";
import { useRideRegistration } from "./hooks/use-ride-registration";
import { useClientSelection } from "./hooks/use-client-selection";

// Components
import { FinanceSummary } from "./components/finance-summary";
import { PDFExport } from "./components/pdf-export";
import { ClientGrid } from "./components/client-grid";
import { RecentRidesList } from "./components/recent-rides-list";
import { RideForm } from "./components/ride-form";

// External Components (Shared)
import { RideModal } from "@/components/ride-modal";
import { ConfirmModal } from "@/components/confirm-modal";

import { MobileDashboardProps } from "./types";

export default function MobileDashboard({ onRideCreated }: MobileDashboardProps) {
    const { user } = useAuth();
    const { toast } = useToast();

    // Data Hook
    const {
        presets,
        recentRides,
        isLoadingHistory,
        isLoadingStats,
        hasNextPage: hasNextRides,
        fetchNextPage: fetchNextRides,
        isFetchingNextPage: isFetchingNextPageRides,
        historyError,
        refetchHistory,
        stats,
        refreshData
    } = useMobileDashboardData(user);

    // Ride Registration Hook
    const {
        selectedClient, setSelectedClient,
        selectedPresetId, setSelectedPresetId,
        customValue, setCustomValue,
        customLocation, setCustomLocation,
        showCustomForm, setShowCustomForm,
        paymentStatus, setPaymentStatus,
        rideDate, setRideDate,
        notes, setNotes,
        photo, setPhoto,
        isSaving,
        handlePhotoChange,
        handleConfirmRide,
        handleDeleteRide,
        rideToEdit, setRideToEdit,
        isRideModalOpen, setIsRideModalOpen,
        rideToDelete, setRideToDelete,
        isDeleting
    } = useRideRegistration({
        onSuccess: () => {
            refreshData();
            if (onRideCreated) onRideCreated();
        }
    });

    // Client Selection Hook
    const {
        clients,
        isLoadingClients,
        hasNextPage: hasNextClients,
        fetchNextPage: fetchNextClients,
        isClientsError,
        clientsError,
        refetchClients,
        isClientModalOpen,
        setIsClientModalOpen,
        newClientName,
        setNewClientName,
        isCreatingClient,
        handleCreateClient
    } = useClientSelection();

    const handleDeletePreset = async (presetId: string) => {
        try {
            await ridesService.deleteRidePreset(presetId);
            refreshData();
            toast({ title: "Preset removido" });
        } catch (err) {
            toast({ title: "Erro ao remover preset", variant: "destructive" });
        }
    };

    return (
        <div className="flex flex-col gap-6 pb-24 max-w-md mx-auto">
            {/* 1. Statistics */}
            <FinanceSummary 
                today={stats.today} 
                week={stats.week} 
                month={stats.month} 
                isLoading={isLoadingStats}
            />

            {/* 2. Client Selection */}
            <ClientGrid
                clients={clients}
                selectedClient={selectedClient}
                onSelect={setSelectedClient}
                isLoading={isLoadingClients}
                hasMore={hasNextClients}
                onLoadMore={fetchNextClients}
                error={clientsError}
                retry={refetchClients}
                openCreateModal={() => setIsClientModalOpen(true)}
                isCreateModalOpen={isClientModalOpen}
                setIsCreateModalOpen={setIsClientModalOpen}
                newClientName={newClientName}
                setNewClientName={setNewClientName}
                isCreating={isCreatingClient}
                onCreate={() => handleCreateClient(setSelectedClient)}
            />

            {/* 3. Ride Form */}
            {selectedClient && (
                <RideForm
                    presets={presets}
                    selectedPresetId={selectedPresetId}
                    onSelectPreset={(id, val, loc) => {
                        setSelectedPresetId(id);
                        setCustomValue(String(val));
                        if (loc) setCustomLocation(loc);
                    }}
                    onDeletePreset={handleDeletePreset}
                    customValue={customValue}
                    setCustomValue={setCustomValue}
                    customLocation={customLocation}
                    setCustomLocation={setCustomLocation}
                    showCustomForm={showCustomForm}
                    setShowCustomForm={setShowCustomForm}
                    paymentStatus={paymentStatus}
                    setPaymentStatus={setPaymentStatus}
                    rideDate={rideDate}
                    setRideDate={setRideDate}
                    notes={notes}
                    setNotes={setNotes}
                    photo={photo}
                    onPhotoChange={handlePhotoChange}
                    onRemovePhoto={() => setPhoto(null)}
                    isSaving={isSaving}
                    onSubmit={handleConfirmRide}
                    canSubmit={!!selectedClient && !!customValue}
                />
            )}

            {/* 4. Recent History */}
            <RecentRidesList
                rides={recentRides}
                onEdit={setRideToEdit}
                onDelete={setRideToDelete}
                isLoading={isLoadingHistory || isFetchingNextPageRides}
                hasMore={hasNextRides}
                onLoadMore={fetchNextRides}
                error={historyError}
                retry={refetchHistory}
            />

            {/* 5. PDF Export */}
            <PDFExport userName={user?.name || "Motorista"} />

            {/* Modals */}
            <RideModal
                isOpen={!!rideToEdit}
                onClose={() => setRideToEdit(null)}
                rideToEdit={rideToEdit}
                onSuccess={refreshData}
            />

            <ConfirmModal
                isOpen={!!rideToDelete}
                onClose={() => setRideToDelete(null)}
                onConfirm={handleDeleteRide}
                title="Excluir Corrida"
                description="Tem certeza que deseja excluir esta corrida? Esta ação não pode ser desfeita."
                isLoading={isDeleting}
            />
        </div>
    );
}
