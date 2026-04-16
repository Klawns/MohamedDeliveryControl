import assert from 'node:assert/strict';
import test from 'node:test';

import { shouldCancelLongPress } from './use-long-press';

test('shouldCancelLongPress ignores small pointer movement', () => {
  assert.equal(
    shouldCancelLongPress(
      { x: 10, y: 10 },
      { x: 16, y: 17 },
      8,
    ),
    false,
  );
});

test('shouldCancelLongPress cancels when movement exceeds tolerance', () => {
  assert.equal(
    shouldCancelLongPress(
      { x: 10, y: 10 },
      { x: 24, y: 10 },
      8,
    ),
    true,
  );
});
