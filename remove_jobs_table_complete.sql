-- Comprehensive script to safely remove jobs table and all its dependencies
-- This script removes cascades, foreign keys, and constraints before dropping the table

-- Step 1: Find and drop all foreign key constraints that reference the jobs table
-- First, let's see what constraints exist (run this to check what will be dropped)
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

-- Step 2: Drop foreign key constraints that reference jobs table
-- (Uncomment and run these if any constraints are found above)

-- Example: If there are foreign keys referencing jobs table
-- ALTER TABLE "public"."some_table" DROP CONSTRAINT IF EXISTS "fk_jobs_id";

-- Step 3: Drop any indexes on the jobs table
DROP INDEX IF EXISTS "public"."idx_jobs_id";
DROP INDEX IF EXISTS "public"."idx_jobs_status";
DROP INDEX IF EXISTS "public"."idx_jobs_created_at";
DROP INDEX IF EXISTS "public"."idx_jobs_customer_id";
DROP INDEX IF EXISTS "public"."idx_jobs_technician_id";

-- Step 4: Drop any triggers on the jobs table
DROP TRIGGER IF EXISTS "jobs_updated_at_trigger" ON "public"."jobs";

-- Step 5: Drop any sequences associated with jobs table
DROP SEQUENCE IF EXISTS "public"."jobs_id_seq" CASCADE;

-- Step 6: Drop any views that depend on jobs table
DROP VIEW IF EXISTS "public"."jobs_view" CASCADE;

-- Step 7: Drop any functions that depend on jobs table
-- (Add specific function names if they exist)

-- Step 8: Finally, drop the jobs table
DROP TABLE IF EXISTS "public"."jobs" CASCADE;

-- Step 9: Clean up any remaining dependencies
-- This will remove any remaining references to the jobs table

-- Verification: Check if jobs table still exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'jobs';

-- If the above query returns no results, the jobs table has been successfully removed
