CREATE TYPE "public"."backup_job_kind" AS ENUM('functional_user');--> statement-breakpoint
CREATE TYPE "public"."backup_job_trigger" AS ENUM('manual');--> statement-breakpoint
CREATE TYPE "public"."backup_job_status" AS ENUM('pending', 'running', 'success', 'failed');--> statement-breakpoint
CREATE TABLE "backup_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "backup_job_kind" DEFAULT 'functional_user' NOT NULL,
	"trigger" "backup_job_trigger" DEFAULT 'manual' NOT NULL,
	"scope_user_id" uuid NOT NULL,
	"actor_user_id" uuid NOT NULL,
	"status" "backup_job_status" DEFAULT 'pending' NOT NULL,
	"storage_key" text,
	"checksum" text,
	"size_bytes" integer,
	"manifest_version" integer DEFAULT 1 NOT NULL,
	"metadata_json" text,
	"error_message" text,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "backup_jobs" ADD CONSTRAINT "backup_jobs_scope_user_id_users_id_fk" FOREIGN KEY ("scope_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "backup_jobs" ADD CONSTRAINT "backup_jobs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "backup_jobs_scope_user_id_idx" ON "backup_jobs" USING btree ("scope_user_id","created_at");--> statement-breakpoint
CREATE INDEX "backup_jobs_actor_user_id_idx" ON "backup_jobs" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "backup_jobs_status_idx" ON "backup_jobs" USING btree ("status");--> statement-breakpoint
