import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getClientRideSelectionSummary,
  pruneSelectedRideIds,
  toggleSelectedRideId,
} from './use-client-ride-selection';

test('toggleSelectedRideId adds and removes the ride id from selection', () => {
  const initialSelection = new Set(['ride-1']);
  const withNewRide = toggleSelectedRideId(initialSelection, 'ride-2');
  const withoutExistingRide = toggleSelectedRideId(withNewRide, 'ride-1');

  assert.deepEqual(Array.from(withNewRide), ['ride-1', 'ride-2']);
  assert.deepEqual(Array.from(withoutExistingRide), ['ride-2']);
});

test('pruneSelectedRideIds keeps only rides that are still loaded', () => {
  const pruned = pruneSelectedRideIds(
    new Set(['ride-1', 'ride-2', 'ride-3']),
    ['ride-2', 'ride-4'],
  );

  assert.deepEqual(Array.from(pruned), ['ride-2']);
});

test('getClientRideSelectionSummary reports all-selected and indeterminate states', () => {
  const indeterminate = getClientRideSelectionSummary(
    ['ride-1', 'ride-2', 'ride-3'],
    new Set(['ride-1']),
  );
  const allSelected = getClientRideSelectionSummary(
    ['ride-1', 'ride-2'],
    new Set(['ride-1', 'ride-2']),
  );

  assert.deepEqual(indeterminate, {
    selectedCount: 1,
    totalLoaded: 3,
    isAllLoadedSelected: false,
    isIndeterminate: true,
  });
  assert.deepEqual(allSelected, {
    selectedCount: 2,
    totalLoaded: 2,
    isAllLoadedSelected: true,
    isIndeterminate: false,
  });
});

test('getClientRideSelectionSummary reports zero state without indeterminate when nothing is selected', () => {
  const summary = getClientRideSelectionSummary(
    ['ride-1', 'ride-2'],
    new Set(),
  );

  assert.deepEqual(summary, {
    selectedCount: 0,
    totalLoaded: 2,
    isAllLoadedSelected: false,
    isIndeterminate: false,
  });
});
