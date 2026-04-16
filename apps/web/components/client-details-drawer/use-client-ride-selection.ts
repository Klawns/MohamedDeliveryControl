'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

interface RideSelectionItem {
  id: string;
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

export function getClientRideSelectionSummary(
  availableRideIds: string[],
  selectedRideIds: Set<string>,
) {
  const selectedCount = selectedRideIds.size;
  const totalLoaded = availableRideIds.length;
  const isAllLoadedSelected =
    totalLoaded > 0 &&
    availableRideIds.every((rideId) => selectedRideIds.has(rideId));

  return {
    selectedCount,
    totalLoaded,
    isAllLoadedSelected,
    isIndeterminate: selectedCount > 0 && !isAllLoadedSelected,
  };
}

interface UseClientRideSelectionParams<T extends RideSelectionItem> {
  rides: T[];
  clientId?: string | null;
}

export function useClientRideSelection<T extends RideSelectionItem>({
  rides,
  clientId,
}: UseClientRideSelectionParams<T>) {
  const loadedRideIds = useMemo(
    () => Array.from(new Set(rides.map((ride) => ride.id).filter(Boolean))),
    [rides],
  );
  const [selectedRideIds, setSelectedRideIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const clearSelection = useCallback(() => {
    setSelectedRideIds(new Set());
  }, []);

  const exitSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedRideIds(new Set());
  }, []);

  useEffect(() => {
    setIsSelectionMode(false);
    setSelectedRideIds(new Set());
  }, [clientId]);

  useEffect(() => {
    setSelectedRideIds((currentSelection) =>
      pruneSelectedRideIds(currentSelection, loadedRideIds),
    );
  }, [loadedRideIds]);

  const enterSelectionMode = useCallback((rideId?: string) => {
    setIsSelectionMode(true);

    if (!rideId) {
      return;
    }

    setSelectedRideIds((currentSelection) => {
      const nextSelection = new Set(currentSelection);
      nextSelection.add(rideId);
      return nextSelection;
    });
  }, []);

  const toggleRide = useCallback((rideId: string) => {
    setSelectedRideIds((currentSelection) =>
      toggleSelectedRideId(currentSelection, rideId),
    );
  }, []);

  const setAllLoadedSelected = useCallback(
    (isSelected: boolean) => {
      setSelectedRideIds(isSelected ? new Set(loadedRideIds) : new Set());
    },
    [loadedRideIds],
  );

  const summary = useMemo(
    () => getClientRideSelectionSummary(loadedRideIds, selectedRideIds),
    [loadedRideIds, selectedRideIds],
  );

  return {
    isSelectionMode,
    selectedRideIds,
    selectedCount: summary.selectedCount,
    totalLoaded: summary.totalLoaded,
    isSelected: (rideId: string) => selectedRideIds.has(rideId),
    hasSelection: summary.selectedCount > 0,
    isAllLoadedSelected: summary.isAllLoadedSelected,
    isIndeterminate: summary.isIndeterminate,
    enterSelectionMode,
    exitSelectionMode,
    toggleRide,
    clearSelection,
    setAllLoadedSelected,
  };
}
