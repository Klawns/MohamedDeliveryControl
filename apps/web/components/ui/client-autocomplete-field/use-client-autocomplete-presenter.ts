'use client';

import { useMemo } from 'react';
import { type ClientAutocompleteState } from '@/hooks/use-client-autocomplete';
import { type ClientDirectoryEntry } from '@/types/rides';
import {
  getClientAutocompleteErrorMessage,
  resolveClientAutocompleteFieldMessages,
  type ClientAutocompleteFieldMessageOverrides,
} from './client-autocomplete-field.messages';

type ClientAutocompletePanelState =
  | 'hidden'
  | 'loading'
  | 'error'
  | 'empty'
  | 'results';

export interface ClientAutocompleteFieldPresenter {
  panelState: ClientAutocompletePanelState;
  statusMessage: string | null;
  showCollapsedStatus: boolean;
  showClearButton: boolean;
  showAppliedHint: boolean;
  isBusy: boolean;
  errorMessage: string | null;
  retryLabel: string;
  suggestions: ClientDirectoryEntry[];
  loadingMessage: string;
  emptyMessage: string;
  hasMoreMessage: string | null;
}

interface BuildClientAutocompletePresenterOptions
  extends ClientAutocompleteFieldMessageOverrides {
  autocomplete: ClientAutocompleteState;
}

function getClientAutocompleteStatusMessage(
  autocomplete: ClientAutocompleteState,
  messages: ReturnType<typeof resolveClientAutocompleteFieldMessages>,
) {
  if (autocomplete.hasSearchValue && !autocomplete.hasMinimumSearchLength) {
    return messages.minLengthMessage(autocomplete.minimumSearchLength);
  }

  if (autocomplete.isLoading) {
    return messages.loadingMessage;
  }

  if (autocomplete.isFetching && autocomplete.isReady) {
    return messages.fetchingMessage;
  }

  if (autocomplete.hasEmptyResults) {
    return messages.emptyMessage;
  }

  return null;
}

function getClientAutocompletePanelState(
  autocomplete: ClientAutocompleteState,
): ClientAutocompletePanelState {
  if (!autocomplete.isOpen) {
    return 'hidden';
  }

  if (autocomplete.isLoading) {
    return 'loading';
  }

  if (autocomplete.isError) {
    return 'error';
  }

  if (autocomplete.hasEmptyResults) {
    return 'empty';
  }

  if (autocomplete.suggestions.length > 0) {
    return 'results';
  }

  return 'hidden';
}

export function buildClientAutocompletePresenter({
  autocomplete,
  ...messageOverrides
}: BuildClientAutocompletePresenterOptions): ClientAutocompleteFieldPresenter {
  const messages = resolveClientAutocompleteFieldMessages(messageOverrides);
  const statusMessage = getClientAutocompleteStatusMessage(
    autocomplete,
    messages,
  );
  const panelState = getClientAutocompletePanelState(autocomplete);

  return {
    panelState,
    statusMessage,
    showCollapsedStatus:
      autocomplete.hasSearchValue && statusMessage !== null && !autocomplete.isOpen,
    showClearButton: Boolean(
      autocomplete.searchText || autocomplete.hasAppliedClient,
    ),
    showAppliedHint:
      autocomplete.hasAppliedClient &&
      autocomplete.hasSearchValue &&
      autocomplete.hasMinimumSearchLength,
    isBusy: autocomplete.isLoading || autocomplete.isFetching,
    errorMessage:
      panelState === 'error'
        ? getClientAutocompleteErrorMessage(autocomplete.error, messages)
        : null,
    retryLabel: messages.retryLabel,
    suggestions: autocomplete.suggestions,
    loadingMessage: messages.loadingMessage,
    emptyMessage: messages.emptyMessage,
    hasMoreMessage: autocomplete.meta?.hasMore
      ? messages.hasMoreMessage(autocomplete.meta)
      : null,
  };
}

export function useClientAutocompletePresenter(
  options: BuildClientAutocompletePresenterOptions,
) {
  const {
    autocomplete,
    emptyMessage,
    loadingMessage,
    fetchingMessage,
    errorFallbackMessage,
    minLengthMessage,
  } = options;

  return useMemo(
    () =>
      buildClientAutocompletePresenter({
        autocomplete,
        emptyMessage,
        loadingMessage,
        fetchingMessage,
        errorFallbackMessage,
        minLengthMessage,
      }),
    [
      autocomplete,
      emptyMessage,
      loadingMessage,
      fetchingMessage,
      errorFallbackMessage,
      minLengthMessage,
    ],
  );
}
