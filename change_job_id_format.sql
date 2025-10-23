-- Change Job IDs to Year + Number Format (250001, 250002, etc.)
-- Run this in your Supabase SQL editor

-- 1. Check current Count values
SELECT "Count", COUNT(*) as count_of_records
FROM all_jobs 
GROUP BY "Count" 
ORDER BY "Count" DESC
LIMIT 10;

-- 2. Check total number of records
SELECT COUNT(*) as total_records FROM all_jobs;

-- 3. Update all existing Count values to new format (250001, 250002, etc.)
-- This will assign sequential numbers starting from 250001
WITH numbered_jobs AS (
  SELECT 
    "Count",
    ROW_NUMBER() OVER (ORDER BY 
      CASE 
        WHEN "Count" ~ '^sgd[0-9]+$' THEN CAST(SUBSTRING("Count" FROM 4) AS INTEGER)
        WHEN "Count" ~ '^[0-9]+$' THEN CAST("Count" AS INTEGER)
        ELSE 0
      END
    ) as new_number
  FROM all_jobs
)
UPDATE all_jobs 
SET "Count" = '25' || LPAD(CAST(nj.new_number AS TEXT), 4, '0')
FROM numbered_jobs nj
WHERE all_jobs."Count" = nj."Count";

-- 4. Verify the updates
SELECT "Count", COUNT(*) as count_of_records
FROM all_jobs 
GROUP BY "Count" 
ORDER BY "Count" DESC
LIMIT 10;

-- 5. Remove default value from Count column
ALTER TABLE all_jobs ALTER COLUMN "Count" DROP DEFAULT;

-- 6. Drop existing sequence
DROP SEQUENCE IF EXISTS all_jobs_count_seq CASCADE;

-- 7. Create new sequence starting from the highest Count + 1
DO $$
DECLARE
    max_count INTEGER;
    total_records INTEGER;
BEGIN
    -- Get total number of records
    SELECT COUNT(*) INTO total_records FROM all_jobs;
    
    -- Calculate starting point (250001 + total records)
    max_count := 250000 + total_records;
    
    -- Create sequence starting from max_count + 1
    EXECUTE format('CREATE SEQUENCE all_jobs_count_seq START %s', max_count + 1);
    
    RAISE NOTICE 'Total records: %', total_records;
    RAISE NOTICE 'Created sequence starting from: %', max_count + 1;
END $$;

-- 8. Set default value for Count column (year + number format)
ALTER TABLE all_jobs ALTER COLUMN "Count" SET DEFAULT '25' || LPAD(CAST(nextval('all_jobs_count_seq') AS TEXT), 4, '0');

-- 9. Make sequence owned by column
ALTER SEQUENCE all_jobs_count_seq OWNED BY all_jobs."Count";

-- 10. Verify the sequence is correct
SELECT 
    last_value as current_sequence_value,
    (SELECT MAX(CAST(SUBSTRING("Count" FROM 3) AS INTEGER)) FROM all_jobs WHERE "Count" LIKE '25%') as highest_25_count,
    (SELECT MAX("Count") FROM all_jobs WHERE "Count" LIKE '25%') as highest_25_count_text,
    '25' || LPAD(CAST(nextval('all_jobs_count_seq') AS TEXT), 4, '0') as next_count_value
FROM all_jobs_count_seq;

-- 11. Test the sequence (this will use up 2 values)
SELECT 
    '25' || LPAD(CAST(nextval('all_jobs_count_seq') AS TEXT), 4, '0') as test_value_1,
    '25' || LPAD(CAST(nextval('all_jobs_count_seq') AS TEXT), 4, '0') as test_value_2;

-- 12. Reset sequence back (subtract 2 since we used nextval twice)
SELECT setval('all_jobs_count_seq', (SELECT last_value FROM all_jobs_count_seq) - 2);

-- 13. Final verification
SELECT 
    'Next Count value will be:' as message,
    '25' || LPAD(CAST(nextval('all_jobs_count_seq') AS TEXT), 4, '0') as next_value;

-- 14. Show sample of updated records
SELECT "Count", "Client Name", "Date", "Sales"
FROM all_jobs 
ORDER BY "Count" DESC
LIMIT 5;
