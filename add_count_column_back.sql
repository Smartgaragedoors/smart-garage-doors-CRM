-- Add Count Column Back and Fix Sequence
-- Run this in your Supabase SQL editor

-- 1. Check current table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'all_jobs' 
ORDER BY ordinal_position;

-- 2. Add Count column back
ALTER TABLE all_jobs ADD COLUMN "Count" TEXT;

-- 3. Count total records
SELECT COUNT(*) as total_records FROM all_jobs;

-- 4. Add a temporary column to store new Count values
ALTER TABLE all_jobs ADD COLUMN temp_count TEXT;

-- 5. Create a temporary table with sequential Count values
CREATE TEMP TABLE count_mapping AS
WITH ordered_jobs AS (
  SELECT 
    "Client Name",
    "Date",
    "Sales",
    ROW_NUMBER() OVER (ORDER BY "Date" ASC, "Client Name" ASC) as row_num
  FROM all_jobs
)
SELECT 
  "Client Name",
  "Date",
  "Sales",
  CAST(250000 + row_num AS TEXT) as new_count
FROM ordered_jobs;

-- 6. Show the mapping (first 10 records)
SELECT "Client Name", "Date", "Sales", new_count
FROM count_mapping
ORDER BY new_count ASC
LIMIT 10;

-- 7. Update the temporary column with new Count values
UPDATE all_jobs 
SET temp_count = cm.new_count
FROM count_mapping cm
WHERE all_jobs."Client Name" = cm."Client Name" 
  AND all_jobs."Date" = cm."Date" 
  AND all_jobs."Sales" = cm."Sales";

-- 8. Now safely update Count column using the temporary column
UPDATE all_jobs 
SET "Count" = temp_count;

-- 9. Drop the temporary column
ALTER TABLE all_jobs DROP COLUMN temp_count;

-- 10. Make Count column NOT NULL and set as primary key
ALTER TABLE all_jobs ALTER COLUMN "Count" SET NOT NULL;

-- 11. Drop existing sequence if it exists
DROP SEQUENCE IF EXISTS all_jobs_count_seq CASCADE;

-- 12. Create new sequence starting from the highest Count + 1
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

-- 13. Set default value for Count column (simple numeric format)
ALTER TABLE all_jobs ALTER COLUMN "Count" SET DEFAULT CAST(nextval('all_jobs_count_seq') AS TEXT);

-- 14. Make sequence owned by column
ALTER SEQUENCE all_jobs_count_seq OWNED BY all_jobs."Count";

-- 15. Verify the updates
SELECT "Count", "Client Name", "Date", "Sales"
FROM all_jobs 
ORDER BY CAST("Count" AS INTEGER) ASC
LIMIT 10;

-- 16. Verify the sequence is correct
SELECT 
    last_value as current_sequence_value,
    (SELECT MAX(CAST("Count" AS INTEGER)) FROM all_jobs) as highest_count,
    CAST(nextval('all_jobs_count_seq') AS TEXT) as next_count_value
FROM all_jobs_count_seq;

-- 17. Test the sequence (this will use up 2 values)
SELECT 
    CAST(nextval('all_jobs_count_seq') AS TEXT) as test_value_1,
    CAST(nextval('all_jobs_count_seq') AS TEXT) as test_value_2;

-- 18. Reset sequence back (subtract 2 since we used nextval twice)
SELECT setval('all_jobs_count_seq', (SELECT last_value FROM all_jobs_count_seq) - 2);

-- 19. Final verification
SELECT 
    'Next Count value will be:' as message,
    CAST(nextval('all_jobs_count_seq') AS TEXT) as next_value;

-- 20. Show sample of updated records
SELECT "Count", "Client Name", "Date", "Sales"
FROM all_jobs 
ORDER BY CAST("Count" AS INTEGER) ASC
LIMIT 5;

-- 21. Clean up temporary table
DROP TABLE count_mapping;
