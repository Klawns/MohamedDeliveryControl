import { ClientModal } from "@/components/client-modal";
import { ConfirmModal } from "@/components/confirm-modal";
import { PaymentModal } from "@/components/payment-modal";
import { RideModal } from "@/components/ride-modal";
import { Client, RideViewModel } from "@/types/rides";

interface ClientModalsProps {
  selectedClient: Client | null;
  modalClient: Client | null;
  clientToEdit: Client | null;
  clientToDelete: Client | null;
  rideToEdit: RideViewModel | null;
  rideToDelete: RideViewModel | null;

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

  onSuccessClient?: (client: Client) => void;
  onSuccessPayment: () => void;
  onSuccessRide: () => void;
}

export function ClientModals({
  selectedClient,
  modalClient,
  clientToEdit,
  clientToDelete,
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
  onSuccessRide,
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
        clientId={modalClient?.id}
        clientName={modalClient?.name}
        rideToEdit={rideToEdit}
      />

      <PaymentModal
        key={`${selectedClient?.id ?? "empty"}-${isPaymentModalOpen ? "open" : "closed"}`}
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
        description={`Deseja realmente excluir o cliente "${clientToDelete?.name}"? Esta acao e irreversivel. Ao apagar este cliente, corridas, pagamentos e outras informacoes relacionadas tambem serao removidas permanentemente.`}
        confirmText="Excluir"
        variant="danger"
        isLoading={isDeleting}
      />

      <ConfirmModal
        isOpen={isCloseDebtConfirmOpen}
        onClose={onCloseCloseDebtConfirm}
        onConfirm={onConfirmCloseDebt}
        title="Fechar Divida"
        description={`Deseja realmente fechar a divida de ${selectedClient?.name}? Isso marcara as corridas como pagas e os adiantamentos como usados.`}
        confirmText="Fechar Divida"
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
