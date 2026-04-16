import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getRideSelectionSummary,
  pruneSelectedRideIds,
  toggleSelectedRideId,
} from './use-ride-selection';

test('toggleSelectedRideId adds and removes the ride id from selection', () => {
  const initialSelection = new Set(['ride-1']);
  const withNewRide = toggleSelectedRideId(initialSelection, 'ride-2');
  const withoutExistingRide = toggleSelectedRideId(withNewRide, 'ride-1');

  assert.deepEqual(Array.from(withNewRide), ['ride-1', 'ride-2']);
  assert.deepEqual(Array.from(withoutExistingRide), ['ride-2']);
});

test('pruneSelectedRideIds keeps only rides that are still visible', () => {
  const pruned = pruneSelectedRideIds(
    new Set(['ride-1', 'ride-2', 'ride-3']),
    ['ride-2', 'ride-4'],
  );

  assert.deepEqual(Array.from(pruned), ['ride-2']);
});

test('getRideSelectionSummary reports all-selected and indeterminate states', () => {
  const indeterminate = getRideSelectionSummary(
    ['ride-1', 'ride-2', 'ride-3'],
    new Set(['ride-1']),
  );
  const allSelected = getRideSelectionSummary(
    ['ride-1', 'ride-2'],
    new Set(['ride-1', 'ride-2']),
  );

  assert.deepEqual(indeterminate, {
    selectedCount: 1,
    totalVisible: 3,
    isAllVisibleSelected: false,
    isIndeterminate: true,
  });
  assert.deepEqual(allSelected, {
    selectedCount: 2,
    totalVisible: 2,
    isAllVisibleSelected: true,
    isIndeterminate: false,
  });
});

test('getRideSelectionSummary reports zero state without indeterminate when nothing is selected', () => {
  const summary = getRideSelectionSummary(
    ['ride-1', 'ride-2'],
    new Set(),
  );

  assert.deepEqual(summary, {
    selectedCount: 0,
    totalVisible: 2,
    isAllVisibleSelected: false,
    isIndeterminate: false,
  });
});
