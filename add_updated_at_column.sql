-- Add updated_at column to all_jobs table
-- This script adds an updated_at column and sets default values

-- Add the updated_at column
ALTER TABLE all_jobs 
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE;

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

-- Set the column to NOT NULL after populating it
ALTER TABLE all_jobs 
ALTER COLUMN updated_at SET NOT NULL;

-- Set default value for future inserts
ALTER TABLE all_jobs 
ALTER COLUMN updated_at SET DEFAULT NOW();

-- Add trigger to automatically update updated_at on row updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
DROP TRIGGER IF EXISTS update_all_jobs_updated_at ON all_jobs;
CREATE TRIGGER update_all_jobs_updated_at
    BEFORE UPDATE ON all_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'all_jobs' 
AND column_name = 'updated_at';
