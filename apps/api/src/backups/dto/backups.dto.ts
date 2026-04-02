import { z } from 'zod';

export const backupJobIdParamSchema = z.string().uuid();
export const backupImportJobIdParamSchema = z.string().uuid();

export const executeBackupImportSchema = z.object({
  importJobId: backupImportJobIdParamSchema,
});

export type ExecuteBackupImportDto = z.infer<typeof executeBackupImportSchema>;
