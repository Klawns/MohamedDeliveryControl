import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getNextClientAutocompleteActiveIndex,
  getPreviousClientAutocompleteActiveIndex,
} from './use-client-autocomplete-navigation';

test('advances the active option and wraps to the first item', () => {
  assert.equal(getNextClientAutocompleteActiveIndex(-1, 3), 0);
  assert.equal(getNextClientAutocompleteActiveIndex(0, 3), 1);
  assert.equal(getNextClientAutocompleteActiveIndex(2, 3), 0);
});

test('moves backwards through options and wraps to the last item', () => {
  assert.equal(getPreviousClientAutocompleteActiveIndex(-1, 3), 2);
  assert.equal(getPreviousClientAutocompleteActiveIndex(2, 3), 1);
  assert.equal(getPreviousClientAutocompleteActiveIndex(0, 3), 2);
});

test('keeps navigation disabled when there are no options', () => {
  assert.equal(getNextClientAutocompleteActiveIndex(0, 0), -1);
  assert.equal(getPreviousClientAutocompleteActiveIndex(0, 0), -1);
});
