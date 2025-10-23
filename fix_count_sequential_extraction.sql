-- Fix Count Format - Extract Only Sequential Number from SGD-202500334
-- Run this in your Supabase SQL editor

-- 1. Check current Count values to understand the format
SELECT "Count", COUNT(*) as count_of_records
FROM all_jobs 
GROUP BY "Count" 
ORDER BY "Count" DESC
LIMIT 10;

-- 2. Find the highest Count value with SGD-2025 format
SELECT MAX("Count") as highest_sgd_2025_count
FROM all_jobs 
WHERE "Count" LIKE 'SGD-2025%';

-- 3. Extract ONLY the sequential number part (last 6 digits from SGD-202500334)
SELECT 
    "Count",
    SUBSTRING("Count" FROM 9) as sequential_part,
    CAST(SUBSTRING("Count" FROM 9) AS INTEGER) as extracted_number
FROM all_jobs 
WHERE "Count" LIKE 'SGD-2025%'
ORDER BY CAST(SUBSTRING("Count" FROM 9) AS INTEGER) DESC
LIMIT 5;

-- 4. Find the highest sequential number from SGD-2025 prefixed Counts
SELECT MAX(CAST(SUBSTRING("Count" FROM 9) AS INTEGER)) as highest_sequential_number
FROM all_jobs 
WHERE "Count" LIKE 'SGD-2025%';

-- 5. Check if there are any Count values that are just numbers
SELECT "Count", COUNT(*) as count_of_records
FROM all_jobs 
WHERE "Count" ~ '^[0-9]+$'
GROUP BY "Count" 
ORDER BY "Count" DESC
LIMIT 10;

-- 6. Remove default value from Count column
ALTER TABLE all_jobs ALTER COLUMN "Count" DROP DEFAULT;

-- 7. Drop existing sequence
DROP SEQUENCE IF EXISTS all_jobs_count_seq CASCADE;

-- 8. Create new sequence starting from the highest sequential number + 1
DO $$
DECLARE
    max_sequential_number INTEGER;
    max_numeric INTEGER;
    max_count INTEGER;
BEGIN
    -- Get the highest sequential number from SGD-2025 prefixed Counts (last 6 digits)
    SELECT COALESCE(MAX(CAST(SUBSTRING("Count" FROM 9) AS INTEGER)), 0) INTO max_sequential_number
    FROM all_jobs 
    WHERE "Count" LIKE 'SGD-2025%';
    
    -- Get the highest pure numeric Count value
    SELECT COALESCE(MAX(CAST("Count" AS INTEGER)), 0) INTO max_numeric
    FROM all_jobs 
    WHERE "Count" ~ '^[0-9]+$';
    
    -- Use the higher of the two
    max_count := GREATEST(max_sequential_number, max_numeric);
    
    -- Create sequence starting from max_count + 1
    EXECUTE format('CREATE SEQUENCE all_jobs_count_seq START %s', max_count + 1);
    
    RAISE NOTICE 'Created sequence starting from: %', max_count + 1;
    RAISE NOTICE 'Highest sequential number was: %', max_sequential_number;
    RAISE NOTICE 'Highest pure numeric count was: %', max_numeric;
END $$;

-- 9. Set default value for Count column (with SGD-2025XXXX format)
ALTER TABLE all_jobs ALTER COLUMN "Count" SET DEFAULT 'SGD-2025' || LPAD(CAST(nextval('all_jobs_count_seq') AS TEXT), 6, '0');

-- 10. Make sequence owned by column
ALTER SEQUENCE all_jobs_count_seq OWNED BY all_jobs."Count";

-- 11. Verify the sequence is correct
SELECT 
    last_value as current_sequence_value,
    (SELECT MAX(CAST(SUBSTRING("Count" FROM 9) AS INTEGER)) FROM all_jobs WHERE "Count" LIKE 'SGD-2025%') as highest_sequential_number,
    (SELECT MAX(CAST("Count" AS INTEGER)) FROM all_jobs WHERE "Count" ~ '^[0-9]+$') as highest_pure_numeric,
    'SGD-2025' || LPAD(CAST(nextval('all_jobs_count_seq') AS TEXT), 6, '0') as next_count_value
FROM all_jobs_count_seq;

-- 12. Test the sequence (this will use up 2 values)
SELECT 
    'SGD-2025' || LPAD(CAST(nextval('all_jobs_count_seq') AS TEXT), 6, '0') as test_value_1,
    'SGD-2025' || LPAD(CAST(nextval('all_jobs_count_seq') AS TEXT), 6, '0') as test_value_2;

-- 13. Reset sequence back (subtract 2 since we used nextval twice)
SELECT setval('all_jobs_count_seq', (SELECT last_value FROM all_jobs_count_seq) - 2);

-- 14. Final verification
SELECT 
    'Next Count value will be:' as message,
    'SGD-2025' || LPAD(CAST(nextval('all_jobs_count_seq') AS TEXT), 6, '0') as next_value;

-- 15. Show what the format should look like
SELECT 
    'Expected format examples:' as message,
    'SGD-202500335' as example_1,
    'SGD-202500336' as example_2,
    'SGD-202500337' as example_3;
