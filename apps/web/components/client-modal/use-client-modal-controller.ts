"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useUpsertClientMutation } from "@/hooks/mutations/use-upsert-client-mutation";
import { parseApiError } from "@/lib/api-error";
import {
  getInitialClientFormValues,
  hasClientFormName,
  toClientFormPayload,
} from "@/mappers/client-form.mapper";
import {
  type ClientModalController,
  type ClientModalControllerProps,
} from "./types";

function getSuccessMessage(isEditing: boolean) {
  return isEditing
    ? "Cliente atualizado com sucesso."
    : "Cliente cadastrado com sucesso.";
}

function getErrorMessage(isEditing: boolean) {
  return isEditing
    ? "Erro ao atualizar cliente. Tente novamente."
    : "Erro ao cadastrar cliente. Tente novamente.";
}

export function useClientModalController({
  onClose,
  onSuccess,
  clientToEdit,
}: ClientModalControllerProps): ClientModalController {
  const [formValues, setFormValues] = useState(() =>
    getInitialClientFormValues(clientToEdit),
  );

  const mutation = useUpsertClientMutation({
    onSuccess: async (client, variables) => {
      toast.success(getSuccessMessage(Boolean(variables.clientId)));
      onSuccess?.(client);
      onClose();
    },
    onError: async (error, variables) => {
      toast.error(
        parseApiError(error, getErrorMessage(Boolean(variables.clientId))),
      );
    },
  });

  const isEditing = Boolean(clientToEdit);

  return {
    formValues,
    isEditing,
    isSubmitting: mutation.isPending,
    isSubmitDisabled: mutation.isPending || !hasClientFormName(formValues),
    title: isEditing ? "Editar Cliente" : "Novo Cliente",
    description: isEditing
      ? "Altere os dados do cliente."
      : "Adicione um novo cliente a sua base.",
    submitLabel: isEditing ? "Salvar Alteracoes" : "Cadastrar Cliente",
    handleClose: onClose,
    handleFieldChange: (field) => (event) => {
      const nextValue = event.target.value;

      setFormValues((current) => ({
        ...current,
        [field]: nextValue,
      }));
    },
    handleSubmit: async (event) => {
      event.preventDefault();

      if (!hasClientFormName(formValues)) {
        return;
      }

      try {
        await mutation.mutateAsync({
          clientId: clientToEdit?.id,
          data: toClientFormPayload(formValues),
        });
      } catch {
        return;
      }
    },
  };
}
