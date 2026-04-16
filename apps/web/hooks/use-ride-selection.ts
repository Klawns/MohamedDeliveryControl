'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

interface RideSelectionItem {
  id: string;
}

function areSetsEqual(left: Set<string>, right: Set<string>) {
  if (left.size !== right.size) {
    return false;
  }

  for (const value of left) {
    if (!right.has(value)) {
      return false;
    }
  }

  return true;
}

export function toggleSelectedRideId(
  selectedRideIds: Set<string>,
  rideId: string,
) {
  const nextSelection = new Set(selectedRideIds);

  if (nextSelection.has(rideId)) {
    nextSelection.delete(rideId);
    return nextSelection;
  }

  nextSelection.add(rideId);
  return nextSelection;
}

export function pruneSelectedRideIds(
  selectedRideIds: Set<string>,
  availableRideIds: string[],
) {
  const availableIds = new Set(availableRideIds);
  return new Set(
    Array.from(selectedRideIds).filter((rideId) => availableIds.has(rideId)),
  );
}

export function getRideSelectionSummary(
  availableRideIds: string[],
  selectedRideIds: Set<string>,
) {
  const selectedCount = selectedRideIds.size;
  const totalVisible = availableRideIds.length;
  const isAllVisibleSelected =
    totalVisible > 0 &&
    availableRideIds.every((rideId) => selectedRideIds.has(rideId));

  return {
    selectedCount,
    totalVisible,
    isAllVisibleSelected,
    isIndeterminate: selectedCount > 0 && !isAllVisibleSelected,
  };
}

interface UseRideSelectionParams<T extends RideSelectionItem> {
  items: T[];
  scopeKey?: string | number | null;
}

export function useRideSelection<T extends RideSelectionItem>({
  items,
  scopeKey,
}: UseRideSelectionParams<T>) {
  const visibleItemIds = useMemo(
    () => Array.from(new Set(items.map((item) => item.id).filter(Boolean))),
    [items],
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const exitSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  useEffect(() => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  }, [scopeKey]);

  useEffect(() => {
    setSelectedIds((currentSelection) => {
      const nextSelection = pruneSelectedRideIds(
        currentSelection,
        visibleItemIds,
      );

      return areSetsEqual(currentSelection, nextSelection)
        ? currentSelection
        : nextSelection;
    });
  }, [visibleItemIds]);

  useEffect(() => {
    if (visibleItemIds.length === 0) {
      setIsSelectionMode(false);
    }
  }, [visibleItemIds.length]);

  const enterSelectionMode = useCallback((itemId?: string) => {
    setIsSelectionMode(true);

    if (!itemId) {
      return;
    }

    setSelectedIds((currentSelection) => {
      const nextSelection = new Set(currentSelection);
      nextSelection.add(itemId);
      return nextSelection;
    });
  }, []);

  const toggleItem = useCallback((itemId: string) => {
    setSelectedIds((currentSelection) =>
      toggleSelectedRideId(currentSelection, itemId),
    );
  }, []);

  const selectAllVisible = useCallback(
    (isSelected: boolean) => {
      setSelectedIds(isSelected ? new Set(visibleItemIds) : new Set());
    },
    [visibleItemIds],
  );

  const summary = useMemo(
    () => getRideSelectionSummary(visibleItemIds, selectedIds),
    [selectedIds, visibleItemIds],
  );

  return {
    isSelectionMode,
    selectedIds,
    selectedCount: summary.selectedCount,
    totalVisible: summary.totalVisible,
    isSelected: (itemId: string) => selectedIds.has(itemId),
    hasSelection: summary.selectedCount > 0,
    isAllVisibleSelected: summary.isAllVisibleSelected,
    isIndeterminate: summary.isIndeterminate,
    enterSelectionMode,
    exitSelectionMode,
    toggleItem,
    clearSelection,
    selectAllVisible,
  };
}
