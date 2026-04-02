ALTER TYPE "public"."backup_job_kind" ADD VALUE IF NOT EXISTS 'technical_full';--> statement-breakpoint
ALTER TYPE "public"."backup_job_kind" ADD VALUE IF NOT EXISTS 'pre_import';--> statement-breakpoint
ALTER TYPE "public"."backup_job_trigger" ADD VALUE IF NOT EXISTS 'scheduled';--> statement-breakpoint
ALTER TYPE "public"."backup_job_trigger" ADD VALUE IF NOT EXISTS 'pre_import';--> statement-breakpoint
ALTER TABLE "backup_jobs" ALTER COLUMN "scope_user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "backup_jobs" ALTER COLUMN "actor_user_id" DROP NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."backup_import_job_status" AS ENUM('validated', 'running', 'success', 'failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE TABLE "backup_import_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scope_user_id" uuid NOT NULL,
	"actor_user_id" uuid NOT NULL,
	"status" "backup_import_job_status" DEFAULT 'validated' NOT NULL,
	"uploaded_storage_key" text NOT NULL,
	"archive_checksum" text,
	"size_bytes" integer,
	"manifest_version" integer DEFAULT 1 NOT NULL,
	"preview_json" text NOT NULL,
	"error_message" text,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "backup_import_jobs" ADD CONSTRAINT "backup_import_jobs_scope_user_id_users_id_fk" FOREIGN KEY ("scope_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "backup_import_jobs" ADD CONSTRAINT "backup_import_jobs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "backup_import_jobs_scope_user_id_idx" ON "backup_import_jobs" USING btree ("scope_user_id","created_at");--> statement-breakpoint
CREATE INDEX "backup_import_jobs_actor_user_id_idx" ON "backup_import_jobs" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "backup_import_jobs_status_idx" ON "backup_import_jobs" USING btree ("status");--> statement-breakpoint
