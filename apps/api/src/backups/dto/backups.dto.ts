import { z } from 'zod';

export const backupJobIdParamSchema = z.string().uuid();
export const backupImportJobIdParamSchema = z.string().uuid();

export const executeBackupImportSchema = z.object({
  importJobId: backupImportJobIdParamSchema,
});

const systemBackupScheduleSchema = z
  .object({
    mode: z.enum(['disabled', 'fixed_time', 'interval']),
    fixedTime: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
    intervalMinutes: z.number().int().positive().nullable(),
  })
  .strict();

const systemBackupRetentionSchema = z
  .object({
    mode: z.enum(['count', 'max_age']),
    maxCount: z.number().int().positive().nullable(),
    maxAgeDays: z.number().int().positive().nullable(),
  })
  .strict();

export const updateSystemBackupSettingsSchema = z
  .object({
    schedule: systemBackupScheduleSchema,
    retention: systemBackupRetentionSchema,
  })
  .strict();

export type ExecuteBackupImportDto = z.infer<typeof executeBackupImportSchema>;
export type UpdateSystemBackupSettingsDto = z.infer<
  typeof updateSystemBackupSettingsSchema
>;
