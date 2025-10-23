-- Simple version: Add updated_at column to all_jobs table
-- This script adds an updated_at column with default values

-- Add the updated_at column
ALTER TABLE all_jobs 
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Set default value for existing records (use Date column if available, otherwise current timestamp)
UPDATE all_jobs 
SET updated_at = 
  CASE 
    WHEN "Date" IS NOT NULL AND "Date" != '' THEN 
      CASE 
        WHEN "Date" ~ '^\d{4}-\d{2}-\d{2}' THEN "Date"::timestamp
        WHEN "Date" ~ '^\d{1,2}/\d{1,2}/\d{4}' THEN 
          TO_TIMESTAMP("Date", 'MM/DD/YYYY')
        ELSE NOW()
      END
    ELSE NOW()
  END;

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'all_jobs' 
AND column_name = 'updated_at';
