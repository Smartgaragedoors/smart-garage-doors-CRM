-- Fix Count Sequence - Handle Both Numeric and Text Values
-- Run this in your Supabase SQL editor

-- 1. Check what Count values we have
SELECT "Count", COUNT(*) as count_of_records
FROM all_jobs 
GROUP BY "Count" 
ORDER BY "Count" DESC
LIMIT 10;

-- 2. Find the highest numeric Count value
SELECT MAX(CAST("Count" AS INTEGER)) as highest_numeric_count
FROM all_jobs 
WHERE "Count" ~ '^[0-9]+$';

-- 3. Find the highest Count value (including text)
SELECT MAX("Count") as highest_text_count
FROM all_jobs;

-- 4. Extract numeric part from text Count values
SELECT 
    "Count",
    REGEXP_REPLACE("Count", '^[A-Za-z]+', '') as numeric_part,
    CAST(REGEXP_REPLACE("Count", '^[A-Za-z]+', '') AS INTEGER) as extracted_number
FROM all_jobs 
WHERE "Count" ~ '^[A-Za-z]+[0-9]+$'
ORDER BY CAST(REGEXP_REPLACE("Count", '^[A-Za-z]+', '') AS INTEGER) DESC
LIMIT 5;

-- 5. Remove default value from Count column
ALTER TABLE all_jobs ALTER COLUMN "Count" DROP DEFAULT;

-- 6. Drop existing sequence
DROP SEQUENCE IF EXISTS all_jobs_count_seq CASCADE;

-- 7. Create new sequence starting from the highest Count value (numeric or text)
DO $$
DECLARE
    max_numeric_count INTEGER;
    max_text_count TEXT;
    max_count INTEGER;
BEGIN
    -- Get the highest numeric Count value
    SELECT COALESCE(MAX(CAST("Count" AS INTEGER)), 0) INTO max_numeric_count
    FROM all_jobs 
    WHERE "Count" ~ '^[0-9]+$';
    
    -- Get the highest Count value (including text)
    SELECT MAX("Count") INTO max_text_count
    FROM all_jobs;
    
    -- Extract numeric part from text Count if it exists
    IF max_text_count ~ '^[A-Za-z]+[0-9]+$' THEN
        max_count := CAST(REGEXP_REPLACE(max_text_count, '^[A-Za-z]+', '') AS INTEGER);
    ELSE
        max_count := max_numeric_count;
    END IF;
    
    -- Use the higher of the two
    IF max_numeric_count > max_count THEN
        max_count := max_numeric_count;
    END IF;
    
    -- Create sequence starting from max_count + 1
    EXECUTE format('CREATE SEQUENCE all_jobs_count_seq START %s', max_count + 1);
    
    RAISE NOTICE 'Created sequence starting from: %', max_count + 1;
    RAISE NOTICE 'Highest numeric count was: %', max_numeric_count;
    RAISE NOTICE 'Highest text count was: %', max_text_count;
END $$;

-- 8. Set default value for Count column
ALTER TABLE all_jobs ALTER COLUMN "Count" SET DEFAULT CAST(nextval('all_jobs_count_seq') AS TEXT);

-- 9. Make sequence owned by column
ALTER SEQUENCE all_jobs_count_seq OWNED BY all_jobs."Count";

-- 10. Verify the sequence is correct
SELECT 
    last_value as current_sequence_value,
    (SELECT MAX(CAST("Count" AS INTEGER)) FROM all_jobs WHERE "Count" ~ '^[0-9]+$') as highest_numeric_count,
    (SELECT MAX("Count") FROM all_jobs) as highest_text_count,
    nextval('all_jobs_count_seq') as next_count_value
FROM all_jobs_count_seq;

-- 11. Test the sequence (this will use up 2 values)
SELECT 
    nextval('all_jobs_count_seq') as test_value_1,
    nextval('all_jobs_count_seq') as test_value_2;

-- 12. Reset sequence back (subtract 2 since we used nextval twice)
SELECT setval('all_jobs_count_seq', (SELECT last_value FROM all_jobs_count_seq) - 2);

-- 13. Final verification
SELECT 
    'Next Count value will be:' as message,
    nextval('all_jobs_count_seq') as next_value;
