import assert from 'node:assert/strict';
import test from 'node:test';

import { isAdminRole, resolveAdminRedirect } from './admin-auth.rules';

test('keeps admin users inside the restricted area flow', () => {
  assert.equal(isAdminRole('admin'), true);
  assert.equal(resolveAdminRedirect('admin'), '/admin');
});

test('sends non-admin users back to the regular dashboard flow', () => {
  assert.equal(isAdminRole('user'), false);
  assert.equal(isAdminRole(undefined), false);
  assert.equal(resolveAdminRedirect('user'), '/dashboard');
  assert.equal(resolveAdminRedirect(undefined), '/dashboard');
});
