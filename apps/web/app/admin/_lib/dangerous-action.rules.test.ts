import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DELETE_CONFIRMATION_TEXT,
  canDeleteUser,
  matchesDangerousActionConfirmation,
  normalizeDangerousActionInput,
} from './dangerous-action.rules';

test('normalizes dangerous action input to uppercase without removing inner content', () => {
  assert.equal(normalizeDangerousActionInput('Excluir agora'), 'EXCLUIR AGORA');
  assert.equal(normalizeDangerousActionInput('  excluir  '), '  EXCLUIR  ');
});

test('accepts delete confirmation text regardless of surrounding whitespace or casing', () => {
  assert.equal(canDeleteUser(DELETE_CONFIRMATION_TEXT), true);
  assert.equal(canDeleteUser('excluir'), true);
  assert.equal(canDeleteUser(' excluir '), true);
  assert.equal(canDeleteUser('EXCLUIR AGORA'), false);
});

test('supports matching other dangerous action confirmation texts', () => {
  assert.equal(
    matchesDangerousActionConfirmation(' restaurar ', 'RESTAURAR'),
    true,
  );
  assert.equal(
    matchesDangerousActionConfirmation('restaurar tudo', 'RESTAURAR'),
    false,
  );
});
