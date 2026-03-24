import { ClientModal } from "@/components/client-modal";
import { RideModal } from "@/components/ride-modal";
import { PaymentModal } from "@/components/payment-modal";
import { ConfirmModal } from "@/components/confirm-modal";
import { Client, Ride } from "@/types/rides";

interface ClientModalsProps {
    selectedClient: Client | null;
    clientToEdit: Client | null;
    rideToEdit: any | null;
    rideToDelete: Ride | null;
    
    isClientModalOpen: boolean;
    isRideModalOpen: boolean;
    isPaymentModalOpen: boolean;
    isDeleteConfirmOpen: boolean;
    isCloseDebtConfirmOpen: boolean;
    
    isSettling: boolean;
    isDeleting: boolean;
    isDeletingRide: boolean;
    
    onCloseClientModal: () => void;
    onCloseRideModal: () => void;
    onClosePaymentModal: () => void;
    onCloseDeleteConfirm: () => void;
    onCloseCloseDebtConfirm: () => void;
    onCloseDeleteRideConfirm: () => void;
    
    onConfirmDeleteClient: () => void;
    onConfirmCloseDebt: () => void;
    onConfirmDeleteRide: () => void;
    
    onSuccessClient: () => void;
    onSuccessPayment: () => void;
    onSuccessRide: () => void;
}

export function ClientModals({
    selectedClient,
    clientToEdit,
    rideToEdit,
    rideToDelete,
    isClientModalOpen,
    isRideModalOpen,
    isPaymentModalOpen,
    isDeleteConfirmOpen,
    isCloseDebtConfirmOpen,
    isSettling,
    isDeleting,
    isDeletingRide,
    onCloseClientModal,
    onCloseRideModal,
    onClosePaymentModal,
    onCloseDeleteConfirm,
    onCloseCloseDebtConfirm,
    onCloseDeleteRideConfirm,
    onConfirmDeleteClient,
    onConfirmCloseDebt,
    onConfirmDeleteRide,
    onSuccessClient,
    onSuccessPayment,
    onSuccessRide
}: ClientModalsProps) {
    return (
        <>
            <ClientModal
                isOpen={isClientModalOpen}
                onClose={onCloseClientModal}
                onSuccess={onSuccessClient}
                clientToEdit={clientToEdit || undefined}
            />

            <RideModal
                isOpen={isRideModalOpen}
                onClose={onCloseRideModal}
                onSuccess={onSuccessRide}
                clientId={selectedClient?.id}
                clientName={selectedClient?.name}
                rideToEdit={rideToEdit}
            />

            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={onClosePaymentModal}
                onSuccess={onSuccessPayment}
                clientId={selectedClient?.id || ""}
                clientName={selectedClient?.name || ""}
            />

            <ConfirmModal
                isOpen={isDeleteConfirmOpen}
                onClose={onCloseDeleteConfirm}
                onConfirm={onConfirmDeleteClient}
                title="Excluir Cliente"
                description={`Deseja realmente excluir o cliente "${selectedClient?.name}"? Esta ação é IRREVERSÍVEL e excluirá todas as corridas e pagamentos vinculados.`}
                confirmText="Excluir"
                variant="danger"
                isLoading={isDeleting}
            />

            <ConfirmModal
                isOpen={isCloseDebtConfirmOpen}
                onClose={onCloseCloseDebtConfirm}
                onConfirm={onConfirmCloseDebt}
                title="Fechar Dívida"
                description={`Deseja realmente fechar a dívida de ${selectedClient?.name}? Isso marcará as corridas como pagas e os adiantamentos como usados.`}
                confirmText="Fechar Dívida"
                isLoading={isSettling}
            />

            <ConfirmModal
                isOpen={!!rideToDelete}
                onClose={onCloseDeleteRideConfirm}
                onConfirm={onConfirmDeleteRide}
                title="Excluir Corrida"
                description="Deseja realmente excluir esta corrida?"
                confirmText="Excluir"
                variant="danger"
                isLoading={isDeletingRide}
            />
        </>
    );
}
