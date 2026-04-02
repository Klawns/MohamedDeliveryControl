DO $$ BEGIN
 CREATE TYPE "public"."backup_import_job_phase" AS ENUM('validated', 'backing_up', 'importing', 'completed', 'failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
ALTER TABLE "backup_import_jobs" ADD COLUMN IF NOT EXISTS "phase" "backup_import_job_phase" DEFAULT 'validated' NOT NULL;--> statement-breakpoint
UPDATE "backup_import_jobs"
SET "phase" = CASE
 WHEN "status" = 'validated' THEN 'validated'::"backup_import_job_phase"
 WHEN "status" = 'running' THEN 'importing'::"backup_import_job_phase"
 WHEN "status" = 'success' THEN 'completed'::"backup_import_job_phase"
 WHEN "status" = 'failed' THEN 'failed'::"backup_import_job_phase"
 ELSE 'validated'::"backup_import_job_phase"
END;--> statement-breakpoint
