import assert from 'node:assert/strict';
import test from 'node:test';
import { buildClientAutocompletePresenter } from './use-client-autocomplete-presenter';
import { type ClientAutocompleteState } from '@/hooks/use-client-autocomplete';

function createAutocompleteState(
  overrides: Partial<ClientAutocompleteState> = {},
): ClientAutocompleteState {
  return {
    searchText: '',
    appliedClientId: undefined,
    appliedClientName: null,
    suggestions: [],
    isOpen: false,
    isLoading: false,
    isFetching: false,
    isError: false,
    error: null,
    isReady: false,
    meta: null,
    hasSearchValue: false,
    hasMinimumSearchLength: false,
    hasAppliedClient: false,
    hasEmptyResults: false,
    minimumSearchLength: 2,
    setSearchText: () => undefined,
    onFocus: () => undefined,
    onOpenChange: () => undefined,
    onSelect: () => undefined,
    onClear: () => undefined,
    refetch: async () => null,
    ...overrides,
  };
}

test('returns a minimum-length status when the typed search is still too short', () => {
  const presenter = buildClientAutocompletePresenter({
    autocomplete: createAutocompleteState({
      searchText: 'A',
      hasSearchValue: true,
      minimumSearchLength: 3,
    }),
  });

  assert.equal(
    presenter.statusMessage,
    'Digite ao menos 3 letras para buscar clientes.',
  );
  assert.equal(presenter.showCollapsedStatus, true);
  assert.equal(presenter.panelState, 'hidden');
});

test('parses API errors outside the view and exposes retry-friendly panel state', () => {
  const presenter = buildClientAutocompletePresenter({
    autocomplete: createAutocompleteState({
      searchText: 'Alice',
      hasSearchValue: true,
      hasMinimumSearchLength: true,
      isOpen: true,
      isError: true,
      error: {
        response: {
          data: {
            message: 'Unauthorized',
          },
        },
      },
    }),
  });

  assert.equal(presenter.panelState, 'error');
  assert.equal(presenter.errorMessage, 'Sessao expirada. Faca login novamente.');
  assert.equal(presenter.retryLabel, 'Tentar novamente');
});

test('keeps pagination guidance in the presenter when the backend reports more matches', () => {
  const presenter = buildClientAutocompletePresenter({
    autocomplete: createAutocompleteState({
      searchText: 'Ali',
      hasSearchValue: true,
      hasMinimumSearchLength: true,
      isOpen: true,
      suggestions: [{ id: 'client-1', name: 'Alice' }],
      meta: {
        returned: 1,
        limit: 8,
        hasMore: true,
        search: 'Ali',
      },
    }),
  });

  assert.equal(presenter.panelState, 'results');
  assert.equal(
    presenter.hasMoreMessage,
    'Mostrando 1 clientes. Continue digitando para refinar.',
  );
});
