-- Fix Sequence to Continue from Highest Count Value
-- Run this in your Supabase SQL editor

-- 1. First, let's see what the highest Count value is
SELECT MAX(CAST("Count" AS INTEGER)) as highest_count
FROM all_jobs 
WHERE "Count" ~ '^[0-9]+$';

-- 2. Remove the default value from the Count column first
ALTER TABLE all_jobs ALTER COLUMN "Count" DROP DEFAULT;

-- 3. Now drop the existing sequence
DROP SEQUENCE IF EXISTS all_jobs_count_seq;

-- 4. Create a new sequence
CREATE SEQUENCE all_jobs_count_seq;

-- 5. Set the sequence to start from the highest existing Count + 1
-- This will make new jobs continue from 500345, 500346, etc.
DO $$
DECLARE
    max_count INTEGER;
BEGIN
    -- Get the highest Count value
    SELECT COALESCE(MAX(CAST("Count" AS INTEGER)), 0) INTO max_count
    FROM all_jobs 
    WHERE "Count" ~ '^[0-9]+$';
    
    -- Set the sequence to start from max_count + 1
    PERFORM setval('all_jobs_count_seq', max_count + 1);
    
    -- Show what the next value will be
    RAISE NOTICE 'Next Count value will be: %', nextval('all_jobs_count_seq');
END $$;

-- 6. Set the default value for the Count column
ALTER TABLE all_jobs ALTER COLUMN "Count" SET DEFAULT CAST(nextval('all_jobs_count_seq') AS TEXT);

-- 7. Make sure the sequence is owned by the column
ALTER SEQUENCE all_jobs_count_seq OWNED BY all_jobs."Count";

-- 8. Verify the sequence is set correctly
SELECT 
    last_value as current_sequence_value,
    (SELECT MAX(CAST("Count" AS INTEGER)) FROM all_jobs WHERE "Count" ~ '^[0-9]+$') as highest_existing_count,
    nextval('all_jobs_count_seq') as next_count_value
FROM all_jobs_count_seq;

-- 9. Test by checking what the next few values will be
SELECT 
    nextval('all_jobs_count_seq') as next_value_1,
    nextval('all_jobs_count_seq') as next_value_2,
    nextval('all_jobs_count_seq') as next_value_3;

-- Reset the sequence back to the correct position (subtract 3 since we used nextval 3 times)
SELECT setval('all_jobs_count_seq', (SELECT last_value FROM all_jobs_count_seq) - 3);
