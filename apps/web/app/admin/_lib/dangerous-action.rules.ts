export const DELETE_CONFIRMATION_TEXT = 'EXCLUIR';

export function normalizeDangerousActionInput(value: string) {
  return value.toUpperCase();
}

export function matchesDangerousActionConfirmation(
  value: string,
  requiredText: string,
) {
  return (
    normalizeDangerousActionInput(value).trim() ===
    normalizeDangerousActionInput(requiredText).trim()
  );
}

export function canDeleteUser(value: string) {
  return matchesDangerousActionConfirmation(value, DELETE_CONFIRMATION_TEXT);
}
