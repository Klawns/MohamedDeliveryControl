import { type Client } from "@/types/rides";
import { type ClientFormValues } from "@/components/client-modal/types";

export type ClientFormPayload = Pick<Client, "name" | "phone" | "address">;

function normalizeOptionalValue(value: string) {
  const normalizedValue = value.trim();

  return normalizedValue ? normalizedValue : null;
}

export function getInitialClientFormValues(
  clientToEdit?: Client,
): ClientFormValues {
  return {
    name: clientToEdit?.name ?? "",
    phone: clientToEdit?.phone ?? "",
    address: clientToEdit?.address ?? "",
  };
}

export function hasClientFormName(values: ClientFormValues) {
  return Boolean(values.name.trim());
}

export function toClientFormPayload(
  values: ClientFormValues,
): ClientFormPayload {
  return {
    name: values.name.trim(),
    phone: normalizeOptionalValue(values.phone),
    address: normalizeOptionalValue(values.address),
  };
}
