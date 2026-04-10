"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ClientModalView } from "@/components/client-modal/client-modal-view";
import {
  type ClientModalControllerProps,
  type ClientModalProps,
} from "@/components/client-modal/types";
import { useClientModalController } from "@/components/client-modal/use-client-modal-controller";

function ClientModalContent({
  onClose,
  onSuccess,
  clientToEdit,
}: ClientModalControllerProps) {
  const controller = useClientModalController({
    onClose,
    onSuccess,
    clientToEdit,
  });

  return <ClientModalView controller={controller} />;
}

export function ClientModal({
  isOpen,
  onClose,
  onSuccess,
  clientToEdit,
}: ClientModalProps) {
  const contentKey = `${clientToEdit?.id ?? "new"}:${isOpen ? "open" : "closed"}`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="w-[calc(100%-2rem)] max-w-md gap-0 overflow-hidden border-border bg-modal-background p-0 shadow-2xl sm:rounded-[2.5rem]"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>
            {clientToEdit ? "Editar Cliente" : "Novo Cliente"}
          </DialogTitle>
          <DialogDescription>
            {clientToEdit
              ? "Altere os dados do cliente."
              : "Adicione um novo cliente a sua base."}
          </DialogDescription>
        </DialogHeader>

        <ClientModalContent
          key={contentKey}
          onClose={onClose}
          onSuccess={onSuccess}
          clientToEdit={clientToEdit}
        />
      </DialogContent>
    </Dialog>
  );
}
