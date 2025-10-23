-- Simple script to remove jobs table with common cascades
-- This covers the most common scenarios

-- Remove foreign key constraints that might reference jobs table
-- (These are common constraint names, adjust if your constraints have different names)

ALTER TABLE "public"."customers" DROP CONSTRAINT IF EXISTS "jobs_customer_id_fkey";
ALTER TABLE "public"."customers" DROP CONSTRAINT IF EXISTS "fk_customers_jobs";
ALTER TABLE "public"."customers" DROP CONSTRAINT IF EXISTS "customers_jobs_fkey";

ALTER TABLE "public"."technicians" DROP CONSTRAINT IF EXISTS "jobs_technician_id_fkey";
ALTER TABLE "public"."technicians" DROP CONSTRAINT IF EXISTS "fk_technicians_jobs";
ALTER TABLE "public"."technicians" DROP CONSTRAINT IF EXISTS "technicians_jobs_fkey";

ALTER TABLE "public"."pipeline_stages" DROP CONSTRAINT IF EXISTS "jobs_stage_id_fkey";
ALTER TABLE "public"."pipeline_stages" DROP CONSTRAINT IF EXISTS "fk_pipeline_stages_jobs";
ALTER TABLE "public"."pipeline_stages" DROP CONSTRAINT IF EXISTS "pipeline_stages_jobs_fkey";

-- Remove common indexes
DROP INDEX IF EXISTS "public"."idx_jobs_id";
DROP INDEX IF EXISTS "public"."idx_jobs_customer_id";
DROP INDEX IF EXISTS "public"."idx_jobs_technician_id";
DROP INDEX IF EXISTS "public"."idx_jobs_stage_id";
DROP INDEX IF EXISTS "public"."idx_jobs_status";
DROP INDEX IF EXISTS "public"."idx_jobs_created_at";

-- Remove common triggers
DROP TRIGGER IF EXISTS "jobs_updated_at_trigger" ON "public"."jobs";
DROP TRIGGER IF EXISTS "jobs_audit_trigger" ON "public"."jobs";

-- Remove common sequences
DROP SEQUENCE IF EXISTS "public"."jobs_id_seq" CASCADE;

-- Finally, drop the table
DROP TABLE IF EXISTS "public"."jobs" CASCADE;

-- Verify it's gone
SELECT 'Jobs table removed successfully' as status
WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'jobs'
);
