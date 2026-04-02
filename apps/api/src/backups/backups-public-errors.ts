export const BACKUP_PUBLIC_ERROR_MESSAGES = {
  createFunctionalJob:
    'Nao foi possivel iniciar o backup agora. Tente novamente em instantes.',
  createTechnicalJob:
    'Nao foi possivel iniciar o backup tecnico agora. Tente novamente em instantes.',
  processFunctionalJob:
    'Falha ao processar o backup. Revise a configuracao e tente novamente.',
  processTechnicalJob:
    'Falha ao processar o backup tecnico. Revise a configuracao e tente novamente.',
  previewUpload:
    'Nao foi possivel armazenar o arquivo do backup. Tente novamente.',
  preImport:
    'Nao foi possivel preparar a restauracao do backup. Tente novamente.',
  executeImport:
    'Nao foi possivel concluir a importacao do backup. Tente novamente.',
} as const;

export function getBackupPublicErrorMessage(
  key: keyof typeof BACKUP_PUBLIC_ERROR_MESSAGES,
) {
  return BACKUP_PUBLIC_ERROR_MESSAGES[key];
}
