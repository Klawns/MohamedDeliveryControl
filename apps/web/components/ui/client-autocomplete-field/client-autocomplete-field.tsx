'use client';

import { Loader2, Search, User as UserIcon, X } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui/popover';
import { type ClientAutocompleteState } from '@/hooks/use-client-autocomplete';
import { cn } from '@/lib/utils';
import {
  useClientAutocompletePresenter,
  type ClientAutocompleteFieldPresenter,
} from './use-client-autocomplete-presenter';
import { type ClientAutocompleteFieldMessageOverrides } from './client-autocomplete-field.messages';
import { useClientAutocompleteNavigation } from './use-client-autocomplete-navigation';

export interface ClientAutocompleteFieldProps
  extends ClientAutocompleteFieldMessageOverrides {
  autocomplete: ClientAutocompleteState;
  placeholder: string;
  inputClassName?: string;
  popoverContentClassName?: string;
  statusClassName?: string;
  appliedHint?: ReactNode;
  footerHint?: ReactNode;
}

interface ClientAutocompleteFieldViewProps
  extends Omit<
    ClientAutocompleteFieldProps,
    | 'emptyMessage'
    | 'loadingMessage'
    | 'fetchingMessage'
    | 'errorFallbackMessage'
    | 'minLengthMessage'
  > {
  presenter: ClientAutocompleteFieldPresenter;
}

function ClientAutocompleteFieldView({
  autocomplete,
  placeholder,
  inputClassName,
  popoverContentClassName,
  statusClassName,
  appliedHint,
  footerHint,
  presenter,
}: ClientAutocompleteFieldViewProps) {
  const collapsedStatusId = useId();
  const navigation = useClientAutocompleteNavigation({
    isOpen: autocomplete.isOpen,
    suggestions: presenter.suggestions,
    onOpenChange: autocomplete.onOpenChange,
    onSelect: autocomplete.onSelect,
  });

  return (
    <div>
      <Popover
        open={autocomplete.isOpen}
        onOpenChange={navigation.onOpenChange}
      >
        <PopoverAnchor asChild>
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary"
            />
            <Input
              role="combobox"
              aria-expanded={autocomplete.isOpen}
              aria-autocomplete="list"
              aria-haspopup="listbox"
              aria-busy={presenter.isBusy}
              aria-controls={
                presenter.panelState === 'results' ? navigation.listboxId : undefined
              }
              aria-activedescendant={navigation.activeOptionId}
              aria-describedby={
                presenter.showCollapsedStatus ? collapsedStatusId : undefined
              }
              autoComplete="off"
              value={autocomplete.searchText}
              onChange={(event) =>
                autocomplete.setSearchText(event.target.value)
              }
              onFocus={autocomplete.onFocus}
              onKeyDown={navigation.onInputKeyDown}
              placeholder={placeholder}
              className={cn(
                'h-11 rounded-xl border-border-subtle bg-card-background pl-10 pr-10 font-medium text-text-primary shadow-sm md:h-12',
                inputClassName,
              )}
            />
            {presenter.showClearButton ? (
              <button
                type="button"
                onClick={autocomplete.onClear}
                className="absolute right-3 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-text-secondary transition hover:bg-hover-accent hover:text-text-primary"
                aria-label="Limpar cliente"
              >
                <X size={14} />
              </button>
            ) : null}
          </div>
        </PopoverAnchor>

        <PopoverContent
          align="start"
          sideOffset={8}
          onOpenAutoFocus={(event) => event.preventDefault()}
          className={cn(
            'w-[var(--radix-popover-trigger-width)] rounded-xl border border-border-subtle bg-card-background p-0 shadow-xl',
            popoverContentClassName,
          )}
        >
          <div className="max-h-72 overflow-y-auto p-2">
            {presenter.panelState === 'loading' ? (
              <div
                role="status"
                aria-live="polite"
                className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium text-text-secondary"
              >
                <Loader2 className="size-4 animate-spin" />
                {presenter.loadingMessage}
              </div>
            ) : null}

            {presenter.panelState === 'error' && presenter.errorMessage ? (
              <div
                role="alert"
                className="rounded-lg border border-border-destructive/20 bg-button-destructive-subtle px-3 py-3 text-sm text-icon-destructive"
              >
                <p>{presenter.errorMessage}</p>
                <button
                  type="button"
                  onClick={() => {
                    void autocomplete.refetch();
                  }}
                  className="mt-2 font-bold uppercase tracking-widest underline underline-offset-4"
                >
                  {presenter.retryLabel}
                </button>
              </div>
            ) : null}

            {presenter.panelState === 'empty' ? (
              <div
                role="status"
                aria-live="polite"
                className="rounded-lg px-3 py-3 text-sm font-medium text-text-secondary"
              >
                {presenter.emptyMessage}
              </div>
            ) : null}

            {presenter.panelState === 'results' ? (
              <div
                id={navigation.listboxId}
                role="listbox"
                aria-label="Sugestoes de clientes"
                className="space-y-1"
              >
                {presenter.suggestions.map((client, index) => (
                  <button
                    key={client.id}
                    id={navigation.getOptionId(index)}
                    type="button"
                    role="option"
                    aria-selected={navigation.isOptionActive(index)}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => navigation.setActiveIndex(index)}
                    onClick={() => navigation.selectOption(client)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium text-text-primary transition hover:bg-hover-accent',
                      navigation.isOptionActive(index) && 'bg-hover-accent',
                    )}
                  >
                    <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <UserIcon size={14} />
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      {client.name}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {presenter.hasMoreMessage ? (
            <div className="border-t border-border-subtle px-3 py-2 text-xs font-medium text-text-secondary">
              {presenter.hasMoreMessage}
            </div>
          ) : null}
        </PopoverContent>
      </Popover>

      {presenter.showAppliedHint ? appliedHint : null}

      {presenter.showCollapsedStatus ? (
        <p
          id={collapsedStatusId}
          className={cn(
            'mt-2 text-xs font-medium text-text-secondary',
            statusClassName,
          )}
        >
          {presenter.statusMessage}
        </p>
      ) : null}

      {footerHint}
    </div>
  );
}

export function ClientAutocompleteField(props: ClientAutocompleteFieldProps) {
  const presenter = useClientAutocompletePresenter(props);

  return <ClientAutocompleteFieldView {...props} presenter={presenter} />;
}
