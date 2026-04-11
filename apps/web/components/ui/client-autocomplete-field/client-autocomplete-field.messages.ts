import { parseApiError } from '@/lib/api-error';
import { type ClientDirectoryMeta } from '@/services/clients-service';

export interface ClientAutocompleteFieldMessageOverrides {
  emptyMessage?: string;
  loadingMessage?: string;
  fetchingMessage?: string;
  errorFallbackMessage?: string;
  minLengthMessage?: (minimumLength: number) => string;
}

export interface ClientAutocompleteFieldMessages {
  emptyMessage: string;
  loadingMessage: string;
  fetchingMessage: string;
  errorFallbackMessage: string;
  retryLabel: string;
  minLengthMessage: (minimumLength: number) => string;
  hasMoreMessage: (meta: ClientDirectoryMeta) => string;
}

export function resolveClientAutocompleteFieldMessages(
  overrides: ClientAutocompleteFieldMessageOverrides = {},
): ClientAutocompleteFieldMessages {
  return {
    emptyMessage:
      overrides.emptyMessage ??
      'Nenhum cliente encontrado para a busca informada.',
    loadingMessage: overrides.loadingMessage ?? 'Buscando clientes...',
    fetchingMessage: overrides.fetchingMessage ?? 'Atualizando sugestoes...',
    errorFallbackMessage:
      overrides.errorFallbackMessage ?? 'Nao foi possivel carregar os clientes.',
    retryLabel: 'Tentar novamente',
    minLengthMessage:
      overrides.minLengthMessage ??
      ((minimumLength) =>
        `Digite ao menos ${minimumLength} letras para buscar clientes.`),
    hasMoreMessage: (meta) =>
      `Mostrando ${meta.returned} clientes. Continue digitando para refinar.`,
  };
}

export function getClientAutocompleteErrorMessage(
  error: unknown,
  messages: Pick<ClientAutocompleteFieldMessages, 'errorFallbackMessage'>,
) {
  return parseApiError(error, messages.errorFallbackMessage);
}
