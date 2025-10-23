-- Count Field Standardization Script
-- Run this in your Supabase SQL editor to standardize Count field formats

-- 1. First, let's see what Count formats we have
SELECT "Count", COUNT(*) as count_of_records
FROM all_jobs 
GROUP BY "Count" 
ORDER BY "Count"
LIMIT 20;

-- 2. Check if we have mixed formats
SELECT 
  CASE 
    WHEN "Count" ~ '^[0-9]+$' THEN 'Numeric Only'
    WHEN "Count" ~ '^[A-Za-z]+[0-9]+$' THEN 'Prefix + Numbers'
    ELSE 'Other Format'
  END as count_format,
  COUNT(*) as record_count
FROM all_jobs 
GROUP BY count_format;

-- 3. Option A: Convert all Count values to numeric format (remove prefixes)
-- This will convert 'sgd000334' to '334' and keep '500334' as '500334'

-- Step 1: Create a backup column (optional)
-- ALTER TABLE all_jobs ADD COLUMN "Count_backup" TEXT;
-- UPDATE all_jobs SET "Count_backup" = "Count";

-- Step 2: Extract numeric part from Count field
UPDATE all_jobs 
SET "Count" = REGEXP_REPLACE("Count", '^[A-Za-z]+', '')
WHERE "Count" ~ '^[A-Za-z]+[0-9]+$';

-- Step 3: Remove leading zeros to normalize
UPDATE all_jobs 
SET "Count" = TRIM(LEADING '0' FROM "Count")
WHERE "Count" ~ '^0+[0-9]+$';

-- Step 4: Handle empty Count values (set to next available number)
WITH max_count AS (
  SELECT COALESCE(MAX(CAST("Count" AS INTEGER)), 0) as max_val
  FROM all_jobs 
  WHERE "Count" ~ '^[0-9]+$'
)
UPDATE all_jobs 
SET "Count" = (SELECT max_val + ROW_NUMBER() OVER (ORDER BY "Count") FROM max_count)::TEXT
WHERE "Count" = '' OR "Count" IS NULL;

-- 4. Option B: Convert all Count values to prefixed format (if you prefer 'sgd' prefix)
-- Uncomment this section if you want to use prefixed format instead

-- UPDATE all_jobs 
-- SET "Count" = 'sgd' || LPAD("Count", 6, '0')
-- WHERE "Count" ~ '^[0-9]+$';

-- 5. Verify the changes
SELECT "Count", COUNT(*) as count_of_records
FROM all_jobs 
GROUP BY "Count" 
ORDER BY CAST("Count" AS INTEGER)
LIMIT 20;

-- 6. Update the sequence to work with the new format
-- Drop existing sequence if it exists
DROP SEQUENCE IF EXISTS all_jobs_count_seq;

-- Create new sequence
CREATE SEQUENCE all_jobs_count_seq;

-- Set sequence to start from highest Count value
SELECT setval('all_jobs_count_seq', COALESCE((SELECT MAX(CAST("Count" AS INTEGER)) FROM all_jobs WHERE "Count" ~ '^[0-9]+$'), 0) + 1);

-- Set default value (numeric format)
ALTER TABLE all_jobs ALTER COLUMN "Count" SET DEFAULT CAST(nextval('all_jobs_count_seq') AS TEXT);

-- Make sequence owned by column
ALTER SEQUENCE all_jobs_count_seq OWNED BY all_jobs."Count";
