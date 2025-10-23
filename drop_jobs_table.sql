-- Drop the jobs table since it's no longer needed
-- The all_jobs table is now the single source of truth

-- Drop the jobs table
DROP TABLE IF EXISTS "public"."jobs" CASCADE;

-- Note: This will remove all data in the jobs table
-- Make sure you have backed up any important data before running this script
