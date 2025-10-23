-- Database Fix for Count Field Auto-Increment (TEXT VERSION)
-- Run this in your Supabase SQL editor

-- 1. First, let's check the current structure
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'all_jobs' AND column_name = 'Count';

-- 2. Since Count is stored as TEXT, we need to handle it differently
-- Option A: Convert Count to INTEGER and make it auto-increment

-- Step 1: Create a sequence for the Count field
CREATE SEQUENCE IF NOT EXISTS all_jobs_count_seq;

-- Step 2: Set the sequence to start from the highest existing Count value (converted to integer)
SELECT setval('all_jobs_count_seq', COALESCE((SELECT MAX(CAST("Count" AS INTEGER)) FROM all_jobs WHERE "Count" ~ '^[0-9]+$'), 0) + 1);

-- Step 3: Set the default value for the Count column (as text)
ALTER TABLE all_jobs ALTER COLUMN "Count" SET DEFAULT CAST(nextval('all_jobs_count_seq') AS TEXT);

-- Step 4: Make sure the sequence is owned by the column
ALTER SEQUENCE all_jobs_count_seq OWNED BY all_jobs."Count";

-- Alternative Option B: If you want to keep Count as TEXT but with auto-increment
-- This approach uses a trigger instead of a default value

-- Step 1: Create a function to generate the next Count value
CREATE OR REPLACE FUNCTION generate_next_count()
RETURNS TRIGGER AS $$
DECLARE
    next_count INTEGER;
BEGIN
    -- Get the next value from sequence
    next_count := nextval('all_jobs_count_seq');
    
    -- Set the Count field to the next value as text
    NEW."Count" := next_count::TEXT;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create trigger to automatically set Count on insert
DROP TRIGGER IF EXISTS set_count_trigger ON all_jobs;
CREATE TRIGGER set_count_trigger
    BEFORE INSERT ON all_jobs
    FOR EACH ROW
    WHEN (NEW."Count" IS NULL OR NEW."Count" = '')
    EXECUTE FUNCTION generate_next_count();

-- Verify the changes
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'all_jobs' AND column_name = 'Count';
