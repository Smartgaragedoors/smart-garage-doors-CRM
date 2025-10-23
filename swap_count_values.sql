-- Swap Count Values: 250001 ↔ 250334, 250002 ↔ 250333, etc.
-- Run this in your Supabase SQL editor

-- 1. Check current Count values and their order
SELECT "Count", "Client Name", "Date", "Sales"
FROM all_jobs 
ORDER BY CAST("Count" AS INTEGER) ASC
LIMIT 10;

-- 2. Count total records
SELECT COUNT(*) as total_records FROM all_jobs;

-- 3. Add a temporary column to store new Count values
ALTER TABLE all_jobs ADD COLUMN temp_count TEXT;

-- 4. Create a temporary table with swapped Count values
CREATE TEMP TABLE count_mapping AS
WITH ordered_jobs AS (
  SELECT 
    "Count" as old_count,
    ROW_NUMBER() OVER (ORDER BY CAST("Count" AS INTEGER) ASC) as row_num
  FROM all_jobs
)
SELECT 
  old_count,
  CAST(250000 + (SELECT COUNT(*) FROM all_jobs) - row_num + 1 AS TEXT) as new_count
FROM ordered_jobs;

-- 5. Show the mapping (first 10 records)
SELECT old_count, new_count
FROM count_mapping
ORDER BY CAST(old_count AS INTEGER) ASC
LIMIT 10;

-- 6. Update the temporary column with new Count values
UPDATE all_jobs 
SET temp_count = cm.new_count
FROM count_mapping cm
WHERE all_jobs."Count" = cm.old_count;

-- 7. Remove default value from Count column
ALTER TABLE all_jobs ALTER COLUMN "Count" DROP DEFAULT;

-- 8. Drop existing sequence
DROP SEQUENCE IF EXISTS all_jobs_count_seq CASCADE;

-- 9. Now safely update Count column using the temporary column
UPDATE all_jobs 
SET "Count" = temp_count;

-- 10. Drop the temporary column
ALTER TABLE all_jobs DROP COLUMN temp_count;

-- 11. Create new sequence starting from the highest Count + 1
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

-- 12. Set default value for Count column (simple numeric format)
ALTER TABLE all_jobs ALTER COLUMN "Count" SET DEFAULT CAST(nextval('all_jobs_count_seq') AS TEXT);

-- 13. Make sequence owned by column
ALTER SEQUENCE all_jobs_count_seq OWNED BY all_jobs."Count";

-- 14. Verify the updates
SELECT "Count", "Client Name", "Date", "Sales"
FROM all_jobs 
ORDER BY CAST("Count" AS INTEGER) ASC
LIMIT 10;

-- 15. Verify the sequence is correct
SELECT 
    last_value as current_sequence_value,
    (SELECT MAX(CAST("Count" AS INTEGER)) FROM all_jobs) as highest_count,
    CAST(nextval('all_jobs_count_seq') AS TEXT) as next_count_value
FROM all_jobs_count_seq;

-- 16. Test the sequence (this will use up 2 values)
SELECT 
    CAST(nextval('all_jobs_count_seq') AS TEXT) as test_value_1,
    CAST(nextval('all_jobs_count_seq') AS TEXT) as test_value_2;

-- 17. Reset sequence back (subtract 2 since we used nextval twice)
SELECT setval('all_jobs_count_seq', (SELECT last_value FROM all_jobs_count_seq) - 2);

-- 18. Final verification
SELECT 
    'Next Count value will be:' as message,
    CAST(nextval('all_jobs_count_seq') AS TEXT) as next_value;

-- 19. Show sample of updated records
SELECT "Count", "Client Name", "Date", "Sales"
FROM all_jobs 
ORDER BY CAST("Count" AS INTEGER) ASC
LIMIT 5;

-- 20. Clean up temporary table
DROP TABLE count_mapping;
