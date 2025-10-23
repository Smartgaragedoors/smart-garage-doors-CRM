-- SAFE STEP-BY-STEP REMOVAL OF JOBS TABLE
-- Run each section separately to ensure everything is cleaned up properly

-- ========================================
-- STEP 1: IDENTIFY DEPENDENCIES
-- ========================================
-- Run this first to see what needs to be removed

-- Check for foreign key constraints
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND (tc.table_name = 'jobs' OR ccu.table_name = 'jobs');

-- Check for indexes on jobs table
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename = 'jobs' AND schemaname = 'public';

-- Check for triggers on jobs table
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE event_object_table = 'jobs' AND event_object_schema = 'public';

-- Check for sequences
SELECT sequence_name 
FROM information_schema.sequences 
WHERE sequence_schema = 'public' 
  AND sequence_name LIKE '%jobs%';

-- ========================================
-- STEP 2: REMOVE FOREIGN KEY CONSTRAINTS
-- ========================================
-- Run this after identifying constraints from Step 1

-- Example constraints (uncomment and modify based on Step 1 results):
-- ALTER TABLE "public"."customers" DROP CONSTRAINT IF EXISTS "fk_customers_jobs_id";
-- ALTER TABLE "public"."technicians" DROP CONSTRAINT IF EXISTS "fk_technicians_jobs_id";
-- ALTER TABLE "public"."pipeline_stages" DROP CONSTRAINT IF EXISTS "fk_pipeline_stages_jobs_id";

-- ========================================
-- STEP 3: REMOVE INDEXES
-- ========================================
-- Run this to remove indexes

DROP INDEX IF EXISTS "public"."idx_jobs_id";
DROP INDEX IF EXISTS "public"."idx_jobs_status";
DROP INDEX IF EXISTS "public"."idx_jobs_created_at";
DROP INDEX IF EXISTS "public"."idx_jobs_customer_id";
DROP INDEX IF EXISTS "public"."idx_jobs_technician_id";
DROP INDEX IF EXISTS "public"."idx_jobs_stage_id";

-- ========================================
-- STEP 4: REMOVE TRIGGERS
-- ========================================
-- Run this to remove triggers

DROP TRIGGER IF EXISTS "jobs_updated_at_trigger" ON "public"."jobs";
DROP TRIGGER IF EXISTS "jobs_audit_trigger" ON "public"."jobs";

-- ========================================
-- STEP 5: REMOVE SEQUENCES
-- ========================================
-- Run this to remove sequences

DROP SEQUENCE IF EXISTS "public"."jobs_id_seq" CASCADE;

-- ========================================
-- STEP 6: REMOVE VIEWS
-- ========================================
-- Run this to remove any views that depend on jobs

DROP VIEW IF EXISTS "public"."jobs_view" CASCADE;
DROP VIEW IF EXISTS "public"."active_jobs_view" CASCADE;

-- ========================================
-- STEP 7: DROP THE TABLE
-- ========================================
-- Run this last to drop the table

DROP TABLE IF EXISTS "public"."jobs" CASCADE;

-- ========================================
-- STEP 8: VERIFICATION
-- ========================================
-- Run this to verify the table is gone

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'jobs';

-- Should return no results if successful
