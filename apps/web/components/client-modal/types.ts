import type { ChangeEvent, FormEvent } from "react";
import { type Client } from "@/types/rides";

export interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (client: Client) => void;
  clientToEdit?: Client;
}

export interface ClientModalControllerProps {
  onClose: () => void;
  onSuccess?: (client: Client) => void;
  clientToEdit?: Client;
}

export interface ClientFormValues {
  name: string;
  phone: string;
  address: string;
}

export interface ClientModalController {
  formValues: ClientFormValues;
  isEditing: boolean;
  isSubmitting: boolean;
  isSubmitDisabled: boolean;
  title: string;
  description: string;
  submitLabel: string;
  handleClose: () => void;
  handleFieldChange: (
    field: keyof ClientFormValues,
  ) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}
