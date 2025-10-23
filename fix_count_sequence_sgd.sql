-- Fix Count Sequence - Handle SGD Prefix
-- Run this in your Supabase SQL editor

-- 1. Check what Count values we have (including SGD prefix)
SELECT "Count", COUNT(*) as count_of_records
FROM all_jobs 
GROUP BY "Count" 
ORDER BY "Count" DESC
LIMIT 10;

-- 2. Find the highest Count value with SGD prefix
SELECT MAX("Count") as highest_sgd_count
FROM all_jobs 
WHERE "Count" LIKE 'sgd%';

-- 3. Extract numeric part from SGD Count values
SELECT 
    "Count",
    SUBSTRING("Count" FROM 4) as numeric_part,
    CAST(SUBSTRING("Count" FROM 4) AS INTEGER) as extracted_number
FROM all_jobs 
WHERE "Count" LIKE 'sgd%'
ORDER BY CAST(SUBSTRING("Count" FROM 4) AS INTEGER) DESC
LIMIT 5;

-- 4. Find the highest numeric value from SGD prefixed Counts
SELECT MAX(CAST(SUBSTRING("Count" FROM 4) AS INTEGER)) as highest_sgd_numeric
FROM all_jobs 
WHERE "Count" LIKE 'sgd%';

-- 5. Remove default value from Count column
ALTER TABLE all_jobs ALTER COLUMN "Count" DROP DEFAULT;

-- 6. Drop existing sequence
DROP SEQUENCE IF EXISTS all_jobs_count_seq CASCADE;

-- 7. Create new sequence starting from the highest SGD Count value + 1
DO $$
DECLARE
    max_sgd_numeric INTEGER;
    max_numeric INTEGER;
    max_count INTEGER;
BEGIN
    -- Get the highest numeric value from SGD prefixed Counts
    SELECT COALESCE(MAX(CAST(SUBSTRING("Count" FROM 4) AS INTEGER)), 0) INTO max_sgd_numeric
    FROM all_jobs 
    WHERE "Count" LIKE 'sgd%';
    
    -- Get the highest pure numeric Count value
    SELECT COALESCE(MAX(CAST("Count" AS INTEGER)), 0) INTO max_numeric
    FROM all_jobs 
    WHERE "Count" ~ '^[0-9]+$';
    
    -- Use the higher of the two
    max_count := GREATEST(max_sgd_numeric, max_numeric);
    
    -- Create sequence starting from max_count + 1
    EXECUTE format('CREATE SEQUENCE all_jobs_count_seq START %s', max_count + 1);
    
    RAISE NOTICE 'Created sequence starting from: %', max_count + 1;
    RAISE NOTICE 'Highest SGD numeric count was: %', max_sgd_numeric;
    RAISE NOTICE 'Highest pure numeric count was: %', max_numeric;
END $$;

-- 8. Set default value for Count column (with SGD prefix)
ALTER TABLE all_jobs ALTER COLUMN "Count" SET DEFAULT 'sgd' || LPAD(CAST(nextval('all_jobs_count_seq') AS TEXT), 6, '0');

-- 9. Make sequence owned by column
ALTER SEQUENCE all_jobs_count_seq OWNED BY all_jobs."Count";

-- 10. Verify the sequence is correct
SELECT 
    last_value as current_sequence_value,
    (SELECT MAX(CAST(SUBSTRING("Count" FROM 4) AS INTEGER)) FROM all_jobs WHERE "Count" LIKE 'sgd%') as highest_sgd_numeric,
    (SELECT MAX("Count") FROM all_jobs WHERE "Count" LIKE 'sgd%') as highest_sgd_count,
    'sgd' || LPAD(CAST(nextval('all_jobs_count_seq') AS TEXT), 6, '0') as next_count_value
FROM all_jobs_count_seq;

-- 11. Test the sequence (this will use up 2 values)
SELECT 
    'sgd' || LPAD(CAST(nextval('all_jobs_count_seq') AS TEXT), 6, '0') as test_value_1,
    'sgd' || LPAD(CAST(nextval('all_jobs_count_seq') AS TEXT), 6, '0') as test_value_2;

-- 12. Reset sequence back (subtract 2 since we used nextval twice)
SELECT setval('all_jobs_count_seq', (SELECT last_value FROM all_jobs_count_seq) - 2);

-- 13. Final verification
SELECT 
    'Next Count value will be:' as message,
    'sgd' || LPAD(CAST(nextval('all_jobs_count_seq') AS TEXT), 6, '0') as next_value;
