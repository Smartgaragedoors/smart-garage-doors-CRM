-- Change All Count Values to Sequential Format (250001, 250002, etc.)
-- Run this in your Supabase SQL editor

-- 1. Check current Count values and their order
SELECT "Count", "Client Name", "Date", "Sales"
FROM all_jobs 
ORDER BY "Count" DESC
LIMIT 10;

-- 2. Count total records
SELECT COUNT(*) as total_records FROM all_jobs;

-- 3. Create a temporary table with the new sequential Count values
CREATE TEMP TABLE count_mapping AS
WITH ordered_jobs AS (
  SELECT 
    "Count" as old_count,
    ROW_NUMBER() OVER (ORDER BY 
      CASE 
        WHEN "Count" LIKE 'SGD-2025%' THEN CAST(SUBSTRING("Count" FROM 9) AS INTEGER)
        WHEN "Count" ~ '^[0-9]+$' THEN CAST("Count" AS INTEGER)
        ELSE 0
      END ASC
    ) as row_num
  FROM all_jobs
)
SELECT 
  old_count,
  250000 + row_num as new_count
FROM ordered_jobs;

-- 4. Show the mapping (first 10 records)
SELECT old_count, new_count
FROM count_mapping
ORDER BY new_count DESC
LIMIT 10;

-- 5. Remove default value from Count column
ALTER TABLE all_jobs ALTER COLUMN "Count" DROP DEFAULT;

-- 6. Drop existing sequence
DROP SEQUENCE IF EXISTS all_jobs_count_seq CASCADE;

-- 7. Update all Count values to new sequential format
UPDATE all_jobs 
SET "Count" = CAST(cm.new_count AS TEXT)
FROM count_mapping cm
WHERE all_jobs."Count" = cm.old_count;

-- 8. Create new sequence starting from the highest Count + 1
DO $$
DECLARE
    max_count INTEGER;
    total_records INTEGER;
BEGIN
    -- Get total number of records
    SELECT COUNT(*) INTO total_records FROM all_jobs;
    
    -- Calculate starting point (250000 + total records)
    max_count := 250000 + total_records;
    
    -- Create sequence starting from max_count + 1
    EXECUTE format('CREATE SEQUENCE all_jobs_count_seq START %s', max_count + 1);
    
    RAISE NOTICE 'Total records: %', total_records;
    RAISE NOTICE 'Created sequence starting from: %', max_count + 1;
END $$;

-- 9. Set default value for Count column (simple numeric format)
ALTER TABLE all_jobs ALTER COLUMN "Count" SET DEFAULT CAST(nextval('all_jobs_count_seq') AS TEXT);

-- 10. Make sequence owned by column
ALTER SEQUENCE all_jobs_count_seq OWNED BY all_jobs."Count";

-- 11. Verify the updates
SELECT "Count", "Client Name", "Date", "Sales"
FROM all_jobs 
ORDER BY CAST("Count" AS INTEGER) DESC
LIMIT 10;

-- 12. Verify the sequence is correct
SELECT 
    last_value as current_sequence_value,
    (SELECT MAX(CAST("Count" AS INTEGER)) FROM all_jobs) as highest_count,
    CAST(nextval('all_jobs_count_seq') AS TEXT) as next_count_value
FROM all_jobs_count_seq;

-- 13. Test the sequence (this will use up 2 values)
SELECT 
    CAST(nextval('all_jobs_count_seq') AS TEXT) as test_value_1,
    CAST(nextval('all_jobs_count_seq') AS TEXT) as test_value_2;

-- 14. Reset sequence back (subtract 2 since we used nextval twice)
SELECT setval('all_jobs_count_seq', (SELECT last_value FROM all_jobs_count_seq) - 2);

-- 15. Final verification
SELECT 
    'Next Count value will be:' as message,
    CAST(nextval('all_jobs_count_seq') AS TEXT) as next_value;

-- 16. Show sample of updated records
SELECT "Count", "Client Name", "Date", "Sales"
FROM all_jobs 
ORDER BY CAST("Count" AS INTEGER) DESC
LIMIT 5;

-- 17. Clean up temporary table
DROP TABLE count_mapping;
