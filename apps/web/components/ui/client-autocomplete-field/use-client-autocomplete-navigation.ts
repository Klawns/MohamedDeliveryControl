'use client';

import { useEffect, useId, useState, type KeyboardEvent } from 'react';
import { type ClientDirectoryEntry } from '@/types/rides';

export function getNextClientAutocompleteActiveIndex(
  currentIndex: number,
  itemCount: number,
) {
  if (itemCount <= 0) {
    return -1;
  }

  return currentIndex < itemCount - 1 ? currentIndex + 1 : 0;
}

export function getPreviousClientAutocompleteActiveIndex(
  currentIndex: number,
  itemCount: number,
) {
  if (itemCount <= 0) {
    return -1;
  }

  if (currentIndex <= 0) {
    return itemCount - 1;
  }

  return currentIndex - 1;
}

interface UseClientAutocompleteNavigationOptions {
  isOpen: boolean;
  suggestions: ClientDirectoryEntry[];
  onOpenChange: (open: boolean) => void;
  onSelect: (client: ClientDirectoryEntry) => void;
}

export function useClientAutocompleteNavigation({
  isOpen,
  suggestions,
  onOpenChange,
  onSelect,
}: UseClientAutocompleteNavigationOptions) {
  const listboxId = useId();
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const hasSuggestions = isOpen && suggestions.length > 0;
  const activeIndex = hasSuggestions
    ? suggestions.findIndex((client) => client.id === activeClientId)
    : -1;

  const activeOptionId =
    hasSuggestions && activeIndex >= 0
      ? `${listboxId}-option-${activeIndex}`
      : undefined;

  useEffect(() => {
    if (!activeOptionId) {
      return;
    }

    document
      .getElementById(activeOptionId)
      ?.scrollIntoView({ block: 'nearest' });
  }, [activeOptionId]);

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        if (suggestions.length === 0) {
          return;
        }

        event.preventDefault();
        onOpenChange(true);
        setActiveClientId(
          suggestions[
            getNextClientAutocompleteActiveIndex(
              activeIndex,
              suggestions.length,
            )
          ]?.id ?? null,
        );
        return;

      case 'ArrowUp':
        if (suggestions.length === 0) {
          return;
        }

        event.preventDefault();
        onOpenChange(true);
        setActiveClientId(
          suggestions[
            getPreviousClientAutocompleteActiveIndex(
              activeIndex,
              suggestions.length,
            )
          ]?.id ?? null,
        );
        return;

      case 'Home':
        if (suggestions.length === 0 || !isOpen) {
          return;
        }

        event.preventDefault();
        setActiveClientId(suggestions[0]?.id ?? null);
        return;

      case 'End':
        if (suggestions.length === 0 || !isOpen) {
          return;
        }

        event.preventDefault();
        setActiveClientId(suggestions.at(-1)?.id ?? null);
        return;

      case 'Enter':
        if (!isOpen || activeIndex < 0 || activeIndex >= suggestions.length) {
          return;
        }

        event.preventDefault();
        setActiveClientId(null);
        onSelect(suggestions[activeIndex]);
        return;

      case 'Escape':
        if (!isOpen) {
          return;
        }

        event.preventDefault();
        setActiveClientId(null);
        onOpenChange(false);
        return;

      default:
        return;
    }
  };

  return {
    listboxId,
    activeOptionId,
    onOpenChange: (open: boolean) => {
      if (!open) {
        setActiveClientId(null);
      }

      onOpenChange(open);
    },
    onInputKeyDown,
    setActiveIndex: (index: number) => {
      setActiveClientId(suggestions[index]?.id ?? null);
    },
    selectOption: (client: ClientDirectoryEntry) => {
      setActiveClientId(null);
      onSelect(client);
    },
    isOptionActive: (index: number) => index === activeIndex,
    getOptionId: (index: number) => `${listboxId}-option-${index}`,
  };
}
