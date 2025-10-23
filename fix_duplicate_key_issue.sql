-- Fix Duplicate Key Issue and Set Correct Sequence
-- Run this in your Supabase SQL editor

-- 1. Check current Count values and identify duplicates
SELECT "Count", COUNT(*) as count_of_records
FROM all_jobs 
GROUP BY "Count" 
HAVING COUNT(*) > 1
ORDER BY "Count" DESC;

-- 2. Check all Count values to see the range
SELECT "Count", COUNT(*) as count_of_records
FROM all_jobs 
GROUP BY "Count" 
ORDER BY "Count" DESC
LIMIT 15;

-- 3. Find the highest Count value with SGD-2025 format
SELECT MAX("Count") as highest_sgd_2025_count
FROM all_jobs 
WHERE "Count" LIKE 'SGD-2025%';

-- 4. Extract the FULL numeric part from SGD-202500334
SELECT 
    "Count",
    SUBSTRING("Count" FROM 5) as full_numeric_part,
    CAST(SUBSTRING("Count" FROM 5) AS INTEGER) as extracted_number
FROM all_jobs 
WHERE "Count" LIKE 'SGD-2025%'
ORDER BY CAST(SUBSTRING("Count" FROM 5) AS INTEGER) DESC
LIMIT 5;

-- 5. Find the highest numeric value from SGD-2025 prefixed Counts
SELECT MAX(CAST(SUBSTRING("Count" FROM 5) AS INTEGER)) as highest_sgd_2025_numeric
FROM all_jobs 
WHERE "Count" LIKE 'SGD-2025%';

-- 6. Check if there are any Count values that are just numbers (like 202500)
SELECT "Count", COUNT(*) as count_of_records
FROM all_jobs 
WHERE "Count" ~ '^[0-9]+$'
GROUP BY "Count" 
ORDER BY "Count" DESC
LIMIT 10;

-- 7. Remove default value from Count column
ALTER TABLE all_jobs ALTER COLUMN "Count" DROP DEFAULT;

-- 8. Drop existing sequence
DROP SEQUENCE IF EXISTS all_jobs_count_seq CASCADE;

-- 9. Create new sequence starting from the highest Count value + 1
DO $$
DECLARE
    max_sgd_2025_numeric INTEGER;
    max_numeric INTEGER;
    max_count INTEGER;
BEGIN
    -- Get the highest numeric value from SGD-2025 prefixed Counts
    SELECT COALESCE(MAX(CAST(SUBSTRING("Count" FROM 5) AS INTEGER)), 0) INTO max_sgd_2025_numeric
    FROM all_jobs 
    WHERE "Count" LIKE 'SGD-2025%';
    
    -- Get the highest pure numeric Count value (like 202500)
    SELECT COALESCE(MAX(CAST("Count" AS INTEGER)), 0) INTO max_numeric
    FROM all_jobs 
    WHERE "Count" ~ '^[0-9]+$';
    
    -- Use the higher of the two
    max_count := GREATEST(max_sgd_2025_numeric, max_numeric);
    
    -- Create sequence starting from max_count + 1
    EXECUTE format('CREATE SEQUENCE all_jobs_count_seq START %s', max_count + 1);
    
    RAISE NOTICE 'Created sequence starting from: %', max_count + 1;
    RAISE NOTICE 'Highest SGD-2025 numeric count was: %', max_sgd_2025_numeric;
    RAISE NOTICE 'Highest pure numeric count was: %', max_numeric;
END $$;

-- 10. Set default value for Count column (with SGD-2025XXXX format)
ALTER TABLE all_jobs ALTER COLUMN "Count" SET DEFAULT 'SGD-2025' || LPAD(CAST(nextval('all_jobs_count_seq') AS TEXT), 6, '0');

-- 11. Make sequence owned by column
ALTER SEQUENCE all_jobs_count_seq OWNED BY all_jobs."Count";

-- 12. Verify the sequence is correct
SELECT 
    last_value as current_sequence_value,
    (SELECT MAX(CAST(SUBSTRING("Count" FROM 5) AS INTEGER)) FROM all_jobs WHERE "Count" LIKE 'SGD-2025%') as highest_sgd_2025_numeric,
    (SELECT MAX(CAST("Count" AS INTEGER)) FROM all_jobs WHERE "Count" ~ '^[0-9]+$') as highest_pure_numeric,
    'SGD-2025' || LPAD(CAST(nextval('all_jobs_count_seq') AS TEXT), 6, '0') as next_count_value
FROM all_jobs_count_seq;

-- 13. Test the sequence (this will use up 2 values)
SELECT 
    'SGD-2025' || LPAD(CAST(nextval('all_jobs_count_seq') AS TEXT), 6, '0') as test_value_1,
    'SGD-2025' || LPAD(CAST(nextval('all_jobs_count_seq') AS TEXT), 6, '0') as test_value_2;

-- 14. Reset sequence back (subtract 2 since we used nextval twice)
SELECT setval('all_jobs_count_seq', (SELECT last_value FROM all_jobs_count_seq) - 2);

-- 15. Final verification
SELECT 
    'Next Count value will be:' as message,
    'SGD-2025' || LPAD(CAST(nextval('all_jobs_count_seq') AS TEXT), 6, '0') as next_value;

-- 16. Check for any remaining duplicates
SELECT "Count", COUNT(*) as count_of_records
FROM all_jobs 
GROUP BY "Count" 
HAVING COUNT(*) > 1;
