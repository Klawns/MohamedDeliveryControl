export const BACKUPS_QUEUE = 'backups';
export const GENERATE_FUNCTIONAL_BACKUP_JOB = 'generate-functional-backup';
export const GENERATE_TECHNICAL_BACKUP_JOB = 'generate-technical-backup';
export const RUN_FUNCTIONAL_BACKUPS_SCHEDULE_JOB =
  'run-functional-backups-schedule';
export const RUN_TECHNICAL_BACKUP_SCHEDULE_JOB =
  'run-technical-backup-schedule';
export const FUNCTIONAL_BACKUP_SCHEDULER_ID = 'functional-backups-scheduler';
export const TECHNICAL_BACKUP_SCHEDULER_ID = 'technical-backup-scheduler';
export const FUNCTIONAL_BACKUP_KIND = 'functional_user';
export const TECHNICAL_BACKUP_KIND = 'technical_full';
export const PRE_IMPORT_BACKUP_KIND = 'pre_import';
export const MANUAL_BACKUP_TRIGGER = 'manual';
export const SCHEDULED_BACKUP_TRIGGER = 'scheduled';
export const PRE_IMPORT_BACKUP_TRIGGER = 'pre_import';
export const BACKUP_MANIFEST_VERSION = 1;
export const DEFAULT_BACKUP_RETENTION_COUNT = 7;
export const DEFAULT_TECHNICAL_BACKUP_RETENTION_COUNT = 7;
export const DEFAULT_BACKUP_HISTORY_LIMIT = 7;
export const DEFAULT_BACKUP_SIGNED_URL_TTL_SECONDS = 300;
export const DEFAULT_BACKUP_STORAGE_PREFIX = 'backups';
export const DEFAULT_BACKUP_IMPORT_FILE_SIZE_LIMIT_BYTES = 25 * 1024 * 1024;
export const DEFAULT_FUNCTIONAL_BACKUP_CRON = '0 3 * * *';
export const DEFAULT_TECHNICAL_BACKUP_CRON = '0 4 * * *';
export const DEFAULT_BACKUP_QUEUE_ENQUEUE_TIMEOUT_MS = 8000;
