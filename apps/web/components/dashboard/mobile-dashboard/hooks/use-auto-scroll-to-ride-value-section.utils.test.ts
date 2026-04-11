import assert from 'node:assert/strict';
import test from 'node:test';
import { isElementTopVisibleWithinBounds } from './use-auto-scroll-to-ride-value-section.utils';

test('returns true when the target top is already visible inside the scroll bounds', () => {
  assert.equal(
    isElementTopVisibleWithinBounds(
      { top: 180, bottom: 420 },
      { top: 100, bottom: 600 },
    ),
    true,
  );
});

test('returns false when the target starts below the visible area', () => {
  assert.equal(
    isElementTopVisibleWithinBounds(
      { top: 680, bottom: 920 },
      { top: 100, bottom: 600 },
    ),
    false,
  );
});

test('returns false when the target is above the visible area', () => {
  assert.equal(
    isElementTopVisibleWithinBounds(
      { top: 40, bottom: 160 },
      { top: 100, bottom: 600 },
    ),
    false,
  );
});
