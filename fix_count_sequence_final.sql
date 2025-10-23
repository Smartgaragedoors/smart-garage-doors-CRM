-- Fix Count Sequence to Continue from Highest Value
-- Run this in your Supabase SQL editor

-- 1. Check current highest Count value
SELECT MAX(CAST("Count" AS INTEGER)) as highest_count
FROM all_jobs 
WHERE "Count" ~ '^[0-9]+$';

-- 2. Check if sequence exists and its current value
SELECT 
    schemaname, 
    sequencename, 
    last_value, 
    start_value, 
    increment_by
FROM pg_sequences 
WHERE sequencename = 'all_jobs_count_seq';

-- 3. Remove default value from Count column
ALTER TABLE all_jobs ALTER COLUMN "Count" DROP DEFAULT;

-- 4. Drop existing sequence
DROP SEQUENCE IF EXISTS all_jobs_count_seq CASCADE;

-- 5. Create new sequence starting from highest Count + 1
DO $$
DECLARE
    max_count INTEGER;
BEGIN
    -- Get the highest Count value
    SELECT COALESCE(MAX(CAST("Count" AS INTEGER)), 0) INTO max_count
    FROM all_jobs 
    WHERE "Count" ~ '^[0-9]+$';
    
    -- Create sequence starting from max_count + 1
    EXECUTE format('CREATE SEQUENCE all_jobs_count_seq START %s', max_count + 1);
    
    RAISE NOTICE 'Created sequence starting from: %', max_count + 1;
END $$;

-- 6. Set default value for Count column
ALTER TABLE all_jobs ALTER COLUMN "Count" SET DEFAULT CAST(nextval('all_jobs_count_seq') AS TEXT);

-- 7. Make sequence owned by column
ALTER SEQUENCE all_jobs_count_seq OWNED BY all_jobs."Count";

-- 8. Verify the sequence is correct
SELECT 
    last_value as current_sequence_value,
    (SELECT MAX(CAST("Count" AS INTEGER)) FROM all_jobs WHERE "Count" ~ '^[0-9]+$') as highest_existing_count,
    nextval('all_jobs_count_seq') as next_count_value
FROM all_jobs_count_seq;

-- 9. Test the sequence
SELECT 
    nextval('all_jobs_count_seq') as test_value_1,
    nextval('all_jobs_count_seq') as test_value_2;

-- Reset sequence back (subtract 2 since we used nextval twice)
SELECT setval('all_jobs_count_seq', (SELECT last_value FROM all_jobs_count_seq) - 2);
